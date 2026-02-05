import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../api";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import "../styles/Auth.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [showResendVerification, setShowResendVerification] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [isResending, setIsResending] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkPassword, setLinkPassword] = useState("");
    const [linkData, setLinkData] = useState<{email: string, googleId: string} | null>(null);
    const [isLinking, setIsLinking] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});
        setShowResendVerification(false);
        setResendMessage("");        try {
            const response = await authService.login({ email, password });
            const accessToken = response?.access_token;
            const refreshToken = response?.refresh_token;
            const user = response?.user;

            if (user?.id && accessToken && refreshToken) {
                login(accessToken, refreshToken, user);
                // Email/password login doesn't have calendar access
                localStorage.setItem('has_calendar_access', 'false');
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
        setErrors({});        try {
            await authService.resendVerificationEmail(email);
            setResendMessage("Verification email sent! Please check your inbox.");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to resend verification email";
            setErrors({ general: errorMessage });
        } finally {
            setIsResending(false);
        }
    }

    async function handleGoogleLogin(credentialResponse: CredentialResponse) {
        setErrors({});
        setShowResendVerification(false);
        setResendMessage("");

        try {
            if (!credentialResponse.credential) {
                setErrors({ general: "Failed to get Google credentials" });
                return;
            }            // Use the credential (ID token) for login
            const response = await authService.googleLogin({ id_token: credentialResponse.credential });
            const accessToken = response?.access_token;
            const refreshToken = response?.refresh_token;
            const user = response?.user;

            if (user?.id && accessToken && refreshToken) {
                login(accessToken, refreshToken, user);
                localStorage.setItem('has_calendar_access', 'false');
                navigate("/");
            } else {
                setErrors({ general: "Google login failed" });
            }
        } catch (error: unknown) {
            // Check if account linking is required
            const err = error as { isLinkRequired?: boolean; data?: { email: string; google_id: string } };
            if (err.isLinkRequired && err.data) {
                setLinkData({
                    email: err.data.email,
                    googleId: err.data.google_id
                });
                setShowLinkModal(true);
                setLinkPassword("");
            } else {
                const errorMessage = error instanceof Error ? error.message : "Google login failed";
                setErrors({ general: errorMessage });
            }
        }
    }

    async function handleLinkAccount() {
        if (!linkData) return;

        setIsLinking(true);
        setErrors({});        try {
            const response = await authService.linkGoogleAccount({
                email: linkData.email,
                password: linkPassword,
                google_id: linkData.googleId
            });
            const accessToken = response?.access_token;
            const refreshToken = response?.refresh_token;
            const user = response?.user;

            if (user?.id && accessToken && refreshToken) {
                login(accessToken, refreshToken, user);
                setShowLinkModal(false);
                navigate("/");
            } else {
                setErrors({ link: "Failed to link account" });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to link account";
            setErrors({ link: errorMessage });
        } finally {
            setIsLinking(false);
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

                <div className="google-login-container">
                    <div className="divider">
                        <span>OR</span>
                    </div>
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => setErrors({ general: "Google login failed" })}
                        useOneTap
                        theme="outline"
                        size="large"
                        text="signin_with"
                        width="100%"
                    />
                </div>

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

            {/* Account Linking Modal */}
            {showLinkModal && linkData && (
                <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Link Google Account</h2>
                        <p>An account with email <strong>{linkData.email}</strong> already exists.</p>
                        <p>Enter your password to link your Google account and enable login with both methods.</p>

                        {errors.link && (
                            <div className="error-message general-error">{errors.link}</div>
                        )}

                        <div className="form-field">
                            <PasswordInput
                                value={linkPassword}
                                onChange={setLinkPassword}
                                placeholder="Enter your password"
                                hasError={!!errors.link}
                                required
                            />
                        </div>

                        <div className="modal-buttons">
                            <button
                                onClick={handleLinkAccount}
                                disabled={isLinking || !linkPassword}
                                className="btn-primary"
                            >
                                {isLinking ? "Linking..." : "Link Account"}
                            </button>
                            <button
                                onClick={() => {
                                    setShowLinkModal(false);
                                    setLinkPassword("");
                                    setErrors({});
                                }}
                                className="btn-secondary"
                                disabled={isLinking}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
