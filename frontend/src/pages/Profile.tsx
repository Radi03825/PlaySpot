import { useAuth } from "../context/AuthContext";
import "../styles/Profile.css";

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
            </div>
        </div>
    );
}

