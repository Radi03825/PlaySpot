import { useState } from "react";
import { register } from "../services/api";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        const res = await register(name, email, password);
        if (res.ok) {
            alert("Регистрацията е успешна!");
            setName(""); setEmail(""); setPassword("");
        } else {
            const text = await res.text();
            alert("Грешка: " + text);
        }
    }

    return (
        <form onSubmit={handleRegister}>
            <h1>Register</h1>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
            <button type="submit">Register</button>
        </form>
    );
}
