import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi, resendVerificationEmail } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import "../styles/Auth.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [showResendVerification, setShowResendVerification] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [isResending, setIsResending] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});
        setShowResendVerification(false);
        setResendMessage("");

        try {
            const response = await loginApi(email, password);
            const accessToken = response?.access_token;
            const refreshToken = response?.refresh_token;
            const user = response?.user;

            if (user?.id && accessToken && refreshToken) {
                login(accessToken, refreshToken, user);
                navigate("/");
            } else {
                setErrors({ general: "Invalid email or password" });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Invalid email or password";

            // Check if the error is due to unverified email
            if (errorMessage.toLowerCase().includes("not activated") ||
                errorMessage.toLowerCase().includes("check your email")) {
                setErrors({ general: "Account is not activated. Please check your email to activate your account." });
                setShowResendVerification(true);
            } else {
                setErrors({ general: errorMessage });
            }
        }
    }

    async function handleResendVerification() {
        setIsResending(true);
        setResendMessage("");
        setErrors({});

        try {
            await resendVerificationEmail(email);
            setResendMessage("Verification email sent! Please check your inbox.");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to resend verification email";
            setErrors({ general: errorMessage });
        } finally {
            setIsResending(false);
        }
    }

    return (
        <div className="auth-container">
            <form onSubmit={handleLogin} className="auth-form">
                <h1>Login</h1>

                {errors.general && (
                    <div className="error-message general-error">{errors.general}</div>
                )}

                {resendMessage && (
                    <div className="success-message">{resendMessage}</div>
                )}

                <div className="form-field">
                    <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        type="email"
                        required
                        className={errors.email ? "error-input" : ""}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="Password"
                    hasError={!!errors.password}
                    errorMessage={errors.password}
                    required
                />

                <div className="forgot-password-link">
                    <Link to="/forgot-password">Forgot password?</Link>
                </div>

                <button type="submit">Login</button>

                {showResendVerification && (
                    <div className="resend-verification">
                        <p>Didn't receive the verification email?</p>
                        <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={isResending}
                            className="resend-button"
                        >
                            {isResending ? "Sending..." : "Resend Verification Email"}
                        </button>
                    </div>
                )}
            </form>
            <p className="auth-footer">
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
}
