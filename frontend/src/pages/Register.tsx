import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../api";
import PasswordInput from "../components/PasswordInput";
import "../styles/Auth.css";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const navigate = useNavigate();

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});
        setRegistrationSuccess(false);

        // Validate password match
        if (password !== confirmPassword) {
            setErrors({ confirmPassword: "Passwords do not match" });
            return;
        }

        // Validate birthdate is not in the future
        if (birthDate && new Date(birthDate) > new Date()) {
            setErrors({ birthDate: "Birth date cannot be in the future" });
            return;
        }        try {
            await authService.register({ 
                name, 
                email, 
                password, 
                birth_date: birthDate 
            });
            setRegistrationSuccess(true);
            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setBirthDate("");

            // Redirect to login after 5 seconds
            setTimeout(() => {
                navigate("/login");
            }, 5000);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Registration failed";
            // Try to parse field-specific errors
            setErrors({ general: errorMessage });
        }
    }

    return (
        <div className="auth-container">
            <form onSubmit={handleRegister} className="auth-form">
                <h1>Register</h1>

                {registrationSuccess && (
                    <div className="success-message">
                        <span className="success-icon">✓</span>
                        <h3>Registration Successful!</h3>
                        <p>Please check your email to activate your account.</p>
                        <p className="info-text">We've sent a verification link to <strong>{email}</strong></p>
                        <p className="redirect-info">Redirecting to login page...</p>
                    </div>
                )}

                {!registrationSuccess && (
                    <>
                        {errors.general && (
                            <div className="error-message general-error">{errors.general}</div>
                        )}

                        <div className="form-field">
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Name"
                                required
                                className={errors.name ? "error-input" : ""}
                            />
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>

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

                        <div className="form-field">
                            <input
                                type="date"
                                value={birthDate}
                                onChange={e => setBirthDate(e.target.value)}
                                placeholder="Birth Date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                className={errors.birthDate || errors.birth_date ? "error-input" : ""}
                            />
                            {(errors.birthDate || errors.birth_date) && (
                                <span className="error-message">{errors.birthDate || errors.birth_date}</span>
                            )}
                        </div>

                        <PasswordInput
                            value={password}
                            onChange={setPassword}
                            placeholder="Password"
                            hasError={!!errors.password}
                            errorMessage={errors.password}
                            required
                        />

                        <PasswordInput
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Confirm Password"
                            hasError={!!errors.confirmPassword}
                            errorMessage={errors.confirmPassword}
                            required
                        />

                        <button type="submit">Register</button>
                    </>
                )}
            </form>
            {!registrationSuccess && (
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            )}
        </div>
    );
}
