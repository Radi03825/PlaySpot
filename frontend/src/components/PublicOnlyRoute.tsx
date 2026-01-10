import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

interface PublicOnlyRouteProps {
    children: ReactNode;
}

export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
    const { user, loading } = useAuth();

    // Show nothing while loading auth state
    if (loading) {
        return null;
    }

    // If user is logged in, redirect to home
    if (user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

