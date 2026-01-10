import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type {ReactNode} from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();

    // Show nothing while loading auth state
    if (loading) {
        return null;
    }

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

