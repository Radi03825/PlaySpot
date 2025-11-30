import { useAuth } from "../context/AuthContext";
import "../styles/Home.css";

export default function Home() {
    const { user, isAuthenticated } = useAuth();

    return (
        <div className="home-container">
            <h1 className="home-title">
                {isAuthenticated ? `Welcome back, ${user?.name}!` : "Welcome to PlaySpot"}
            </h1>
            <p className="home-subtitle">
                Your ultimate destination for sports and activities!
            </p>
            <div className="home-content">
                {isAuthenticated ? (
                    <p className="home-description">
                        Great to see you again! You're now logged in and can access all features of PlaySpot.
                        Start exploring sports venues, book your favorite activities, and connect with other sports enthusiasts!
                    </p>
                ) : (
                    <p className="home-description">
                        Join our community to discover amazing sports venues, book your favorite activities,
                        and connect with other sports enthusiasts. Start your journey with us today!
                    </p>
                )}
            </div>
        </div>
    );
}

