import { useAuth } from "../context/AuthContext";
import "../styles/Profile.css";

// Function to calculate age in years, months, and days
function calculateAge(birthDateString: string): string {
    const birthDate = new Date(birthDateString);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Adjust if days are negative
    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }

    // Adjust if months are negative
    if (months < 0) {
        years--;
        months += 12;
    }

    return `${years} years, ${months} months and ${days} days`;
}

export default function Profile() {
    const { user } = useAuth();

    return (
        <div className="profile-container">
            <h1>User Profile</h1>
            <div className="profile-info">
                <div className="profile-field">
                    <strong>Name:</strong>
                    <span>{user?.name}</span>
                </div>
                <div className="profile-field">
                    <strong>Email:</strong>
                    <span>{user?.email}</span>
                </div>
                <div className="profile-field">
                    <strong>Birth Date:</strong>
                    <span>
                        {user?.birth_date ? new Date(user?.birth_date).toLocaleDateString() : 'N/A'}
                        {user?.birth_date && ` (${calculateAge(user?.birth_date)})`}
                    </span>
                </div>
            </div>
        </div>
    );
}
