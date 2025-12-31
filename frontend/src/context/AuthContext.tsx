import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "../types";

interface AuthContextType {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    login: (accessToken: string, refreshToken: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    updateToken: (newToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);

    // Load user, token, and refresh token from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedRefreshToken = localStorage.getItem("refreshToken");
        const savedUser = localStorage.getItem("user");

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        if (savedRefreshToken) {
            setRefreshToken(savedRefreshToken);
        }
    }, []);

    const login = (accessToken: string, newRefreshToken: string, newUser: User) => {
        setToken(accessToken);
        setRefreshToken(newRefreshToken);
        setUser(newUser);
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        localStorage.setItem("user", JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("has_calendar_access");
    };

    const updateToken = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem("token", newToken);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                refreshToken,
                login,
                logout,
                isAuthenticated: !!user && !!token,
                updateToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

