import { useState } from "react";
import { login } from "../services/api";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        try {
            const response = await login(email, password);
            const user = response?.user;
            if (user?.id) {
                alert("Успешно влизане! Добре дошъл " + user.name);
                console.log(user);
            } else {
                alert("Грешен email или парола");
            }
        } catch (err) {
            alert("Грешка при login");
            console.error(err);
        }
    }

    return (
        <form onSubmit={handleLogin}>
            <h1>Login</h1>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
            <button type="submit">Login</button>
        </form>
    );
}
