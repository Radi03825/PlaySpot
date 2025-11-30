import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";
import * as React from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        try {
            const response = await loginApi(email, password);
            const token = response?.token;
            const user = response?.user;

            if (user?.id && token) {
                login(token, user);
                alert("Успешно влизане! Добре дошъл " + user.name);
                navigate("/");
            } else {
                alert("Грешен email или парола");
            }
        } catch (err) {
            alert("Грешка при login");
            console.error(err);
        }
    }

    return (
        <div className="auth-container">
            <form onSubmit={handleLogin} className="auth-form">
                <h1>Login</h1>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                <button type="submit">Login</button>
            </form>
            <p className="auth-footer">
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
}
