import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AgentResponseProps {
    answer: string;
}

export default function AgentResponse({ answer }: AgentResponseProps) {
    return (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
            <div className="agent-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
            </div>
        </div>
    );
}
