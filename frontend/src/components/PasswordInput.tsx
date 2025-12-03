import { useState } from "react";
import "../styles/Auth.css";

interface PasswordInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    hasError?: boolean;
    errorMessage?: string;
    required?: boolean;
}

export default function PasswordInput({
    value,
    onChange,
    placeholder = "Password",
    hasError = false,
    errorMessage,
    required = false
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="form-field">
            <div className="password-input-wrapper">
                <input
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    className={hasError ? "error-input" : ""}
                />
                <span
                    className="password-toggle-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setShowPassword(!showPassword);
                        }
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                </span>
            </div>
            {errorMessage && <span className="error-message">{errorMessage}</span>}
        </div>
    );
}

