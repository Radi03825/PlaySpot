import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import "../styles/Auth.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});

        try {
            const response = await loginApi(email, password);
            const token = response?.token;
            const user = response?.user;

            if (user?.id && token) {
                login(token, user);
                navigate("/");
            } else {
                setErrors({ general: "Invalid email or password" });
            }
        } catch {
            setErrors({ general: "Invalid email or password" });
        }
    }

    return (
        <div className="auth-container">
            <form onSubmit={handleLogin} className="auth-form">
                <h1>Login</h1>

                {errors.general && (
                    <div className="error-message general-error">{errors.general}</div>
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

                <button type="submit">Login</button>
            </form>
            <p className="auth-footer">
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
}
