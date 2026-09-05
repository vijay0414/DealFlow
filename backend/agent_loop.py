import time
import json
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from system_prompt import SYSTEM_PROMPT

from tools.search_products import declaration as search_decl, execute as search_exec
from tools.compare_prices import declaration as compare_decl, execute as compare_exec
from tools.verify_dealer import declaration as verify_decl, execute as verify_exec
from tools.check_logistics import declaration as logistics_decl, execute as logistics_exec

TOOL_REGISTRY = {
    "search_products": search_exec,
    "compare_prices": compare_exec,
    "verify_dealer": verify_exec,
    "check_logistics": logistics_exec
}

# ---------------------------------------------------------------------------
# Tool format helpers
# ---------------------------------------------------------------------------

def _decl_to_groq(decl) -> dict:
    schema = decl.parameters
    def _to_dict(s):
        result = {"type": str(s.type).split(".")[-1].lower()}
        if s.description:
            result["description"] = s.description
        if s.properties:
            result["properties"] = {k: _to_dict(v) for k, v in s.properties.items()}
        if s.required:
            result["required"] = list(s.required)
        if hasattr(s, "items") and s.items:
            result["items"] = _to_dict(s.items)
        return result
    return {
        "type": "function",
        "function": {
            "name": decl.name,
            "description": decl.description,
            "parameters": _to_dict(schema)
        }
    }

GROQ_TOOLS = [_decl_to_groq(d) for d in [search_decl, compare_decl, verify_decl, logistics_decl]]
GEMINI_DECLARATIONS = [search_decl, compare_decl, verify_decl, logistics_decl]

# ---------------------------------------------------------------------------
# Lazy clients
# ---------------------------------------------------------------------------

_groq_client = None
_gemini_client = None

def _get_groq():
    global _groq_client
    if _groq_client is None:
        from groq import AsyncGroq
        _groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _groq_client

def _get_gemini():
    global _gemini_client
    if _gemini_client is None:
        from google import genai
        _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _gemini_client

# ---------------------------------------------------------------------------
# Groq agent loop
# ---------------------------------------------------------------------------

async def _run_groq(db: AsyncSession, messages: list) -> dict:
    groq_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    client = _get_groq()
    trace = []
    status = "completed"
    final_answer = ""
    step_count = 0

    for _ in range(6):
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=groq_messages,
            tools=GROQ_TOOLS,
            tool_choice="auto",
            temperature=0.0,
            max_tokens=4096
        )
        msg = response.choices[0].message

        if msg.tool_calls:
            groq_messages.append({
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {"id": tc.id, "type": "function",
                     "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                    for tc in msg.tool_calls
                ]
            })
            for tc in msg.tool_calls:
                step_count += 1
                tool_name = tc.function.name
                try:
                    tool_args = json.loads(tc.function.arguments)
                except Exception:
                    tool_args = {}
                start = time.time()
                try:
                    tool_result = await TOOL_REGISTRY[tool_name](db, tool_args) if tool_name in TOOL_REGISTRY else {"error": f"Unknown tool: {tool_name}"}
                except Exception as e:
                    tool_result = {"error": str(e)}
                trace.append({"step": step_count, "tool": tool_name, "input": tool_args, "output": tool_result, "duration_ms": int((time.time()-start)*1000)})
                groq_messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(tool_result)})
        else:
            final_answer = msg.content or ""
            break
    else:
        status = "max_iterations"

    return {"answer": final_answer, "trace": trace, "status": status}

# ---------------------------------------------------------------------------
# Gemini agent loop
# ---------------------------------------------------------------------------

async def _run_gemini(db: AsyncSession, messages: list) -> dict:
    from google.genai import types
    from google.genai.errors import APIError

    client = _get_gemini()
    gemini_messages = []
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        gemini_messages.append(types.Content(role=role, parts=[types.Part.from_text(text=content)]))

    trace = []
    status = "completed"
    final_answer = ""
    step_count = 0

    for _ in range(6):
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=gemini_messages,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=[types.Tool(function_declarations=GEMINI_DECLARATIONS)],
                temperature=0.0
            )
        )
        if not response.candidates:
            break

        candidate = response.candidates[0]
        if not candidate.content or not candidate.content.parts:
            final_answer = response.text or ""
            break

        has_func = any(p.function_call for p in candidate.content.parts)
        if has_func:
            gemini_messages.append(candidate.content)
            tool_parts = []
            for part in candidate.content.parts:
                if part.function_call:
                    step_count += 1
                    fc = part.function_call
                    tool_args = {k: v for k, v in fc.args.items()} if fc.args else {}
                    start = time.time()
                    try:
                        tool_result = await TOOL_REGISTRY[fc.name](db, tool_args) if fc.name in TOOL_REGISTRY else {"error": f"Unknown tool: {fc.name}"}
                    except Exception as e:
                        tool_result = {"error": str(e)}
                    trace.append({"step": step_count, "tool": fc.name, "input": tool_args, "output": tool_result, "duration_ms": int((time.time()-start)*1000)})
                    tool_parts.append(types.Part.from_function_response(name=fc.name, response=tool_result))
            gemini_messages.append(types.Content(role="user", parts=tool_parts))
        else:
            final_answer = "\n".join(p.text for p in candidate.content.parts if p.text)
            break
    else:
        status = "max_iterations"

    return {"answer": final_answer, "trace": trace, "status": status}

# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def run_agent(db: AsyncSession, messages: list | None = None, query: str | None = None) -> dict:
    # Normalise input to a flat chat message list
    if messages is None:
        chat_messages = [{"role": "user", "content": query}]
    else:
        chat_messages = []
        for m in messages:
            role = m.get("role", "user")
            # Gemini uses "model", OpenAI/Groq uses "assistant" — normalise
            if role == "model":
                role = "assistant"
            parts = m.get("parts", [])
            content = m.get("content") or " ".join(p.get("text", "") for p in parts if "text" in p)
            chat_messages.append({"role": role, "content": content})

    try:
        if settings.LLM_PROVIDER == "gemini":
            return await _run_gemini(db, chat_messages)
        else:
            return await _run_groq(db, chat_messages)
    except Exception as e:
        return {"answer": f"I encountered an error: {e}", "trace": [], "status": "error"}
