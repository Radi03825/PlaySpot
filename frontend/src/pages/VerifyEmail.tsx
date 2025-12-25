import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../services/api";
import "../styles/Auth.css";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const token = searchParams.get("token");

    useEffect(() => {
        async function verify() {
            if (!token) {
                setStatus("error");
                setMessage("Invalid verification link. Please check your email for the correct link.");
                return;
            }

            try {
                const response = await verifyEmail(token);
                setStatus("success");
                setMessage(response.message || "Email verified successfully! You can now login to your account.");

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            } catch (error) {
                setStatus("error");
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Failed to verify email. The link may be expired or invalid."
                );
            }
        }

        verify();
    }, [token, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h1>Email Verification</h1>

                {status === "loading" && (
                    <div className="info-message">
                        <div className="spinner"></div>
                        <p>Verifying your email...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="success-message">
                        <span className="success-icon">✓</span>
                        <p>{message}</p>
                        <p className="redirect-info">Redirecting to login page...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="error-message">
                        <span className="error-icon">✗</span>
                        <p>{message}</p>
                        <div className="verification-actions">
                            <Link to="/login" className="link-button">
                                Go to Login
                            </Link>
                            <Link to="/register" className="link-button secondary">
                                Register New Account
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

