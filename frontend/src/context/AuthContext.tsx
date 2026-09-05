import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin, register as apiRegister } from "../api/client";
import type { User } from "../types";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    password: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, role: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [password, setPassword] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedKey = localStorage.getItem("dealflow_password");
        const storedUser = localStorage.getItem("dealflow_user");
        if (storedKey && storedUser) {
            try {
                setUser(JSON.parse(storedUser) as User);
                setPassword(storedKey);
            } catch {
                localStorage.removeItem("dealflow_password");
                localStorage.removeItem("dealflow_user");
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, key: string) => {
        const res = await apiLogin(email, key);
        const userData = res.user as User;
        localStorage.setItem("dealflow_password", res.password);
        localStorage.setItem("dealflow_user", JSON.stringify(userData));
        setUser(userData);
        setPassword(res.password);
    };

    const logout = () => {
        localStorage.removeItem("dealflow_password");
        localStorage.removeItem("dealflow_user");
        setUser(null);
        setPassword(null);
    };

    const registerUser = async (name: string, email: string, role: string, key: string) => {
        const res = await apiRegister(name, email, role, key);
        const userData = res.user as User;
        localStorage.setItem("dealflow_password", res.password);
        localStorage.setItem("dealflow_user", JSON.stringify(userData));
        setUser(userData);
        setPassword(res.password);
    };

    return (
        <AuthContext.Provider value={{ user, loading, password, login, register: registerUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
