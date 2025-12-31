import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
    const { user, isAuthenticated } = useAuth();

    return (
        <div className="home-container">
            <h1 className="home-title">
                Welcome to PlaySpot
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

            {isAuthenticated && user?.role_id !== 3 && (
                <div className="manager-cta">
                    <h2>Do you own a sports facility?</h2>
                    <p>Register your sport complex or facility and reach more customers!</p>
                    <Link to="/become-manager" className="cta-button">
                        Become a Facility Manager
                    </Link>
                </div>
            )}
        </div>
    );
}

