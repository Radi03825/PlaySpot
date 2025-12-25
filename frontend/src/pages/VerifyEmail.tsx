import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { verifyEmail, resendVerificationEmail } from "../services/api";
import "../styles/Auth.css";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error" | "expired" | "already_verified">("loading");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [resendMessage, setResendMessage] = useState("");
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

                // Check if already verified
                if (response.already_verified) {
                    setStatus("already_verified");
                    setMessage(response.message || "Your account is already activated! You can login now.");
                } else {
                    setStatus("success");
                    setMessage(response.message || "Email verified successfully! You can now login to your account.");

                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate("/login");
                    }, 3000);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to verify email";

                // Check if token is expired
                if (errorMessage.toLowerCase().includes("expired") ||
                    errorMessage.toLowerCase().includes("invalid token")) {
                    setStatus("expired");
                    setMessage("Your verification link has expired or is invalid.");
                } else {
                    setStatus("error");
                    setMessage(errorMessage);
                }
            }
        }

        verify();
    }, [token, navigate]);

    const handleResendEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setResendMessage("Please enter your email address");
            setResendStatus("error");
            return;
        }

        setResendStatus("sending");
        setResendMessage("");

        try {
            const response = await resendVerificationEmail(email);
            setResendStatus("sent");
            setResendMessage(response.message || "Verification email sent! Please check your inbox.");
        } catch (error) {
            setResendStatus("error");
            setResendMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to send verification email. Please try again."
            );
        }
    };

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
                        <h2>Account Activated!</h2>
                        <p>{message}</p>
                        <p className="redirect-info">Redirecting to login page in 3 seconds...</p>
                    </div>
                )}

                {status === "already_verified" && (
                    <div className="success-message">
                        <span className="success-icon">✓</span>
                        <h2>Account Already Activated!</h2>
                        <p>Your account has already been verified. You can now login to your account.</p>
                        <div className="verification-actions">
                            <Link to="/login" className="link-button">
                                Go to Login
                            </Link>
                        </div>
                    </div>
                )}

                {status === "expired" && (
                    <div className="error-message">
                        <span className="error-icon">⏱</span>
                        <h2>Verification Link Expired</h2>
                        <p>{message}</p>

                        {resendStatus !== "sent" ? (
                            <div className="resend-section">
                                <p className="resend-info">Enter your email to receive a new verification link:</p>
                                <form onSubmit={handleResendEmail}>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="form-input"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="form-button"
                                        disabled={resendStatus === "sending"}
                                    >
                                        {resendStatus === "sending" ? "Sending..." : "Send New Verification Email"}
                                    </button>
                                </form>
                                {resendStatus === "error" && (
                                    <p className="error-text">{resendMessage}</p>
                                )}
                            </div>
                        ) : (
                            <div className="success-message">
                                <span className="success-icon">✓</span>
                                <p>{resendMessage}</p>
                                <p className="info-text">Check your email and click the new verification link.</p>
                            </div>
                        )}
                    </div>
                )}

                {status === "error" && (
                    <div className="error-message">
                        <span className="error-icon">✗</span>
                        <h2>Verification Failed</h2>
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

