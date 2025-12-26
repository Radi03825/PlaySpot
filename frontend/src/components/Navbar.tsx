import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                PlaySpot
            </Link>
            <div className="navbar-links">
                <Link to="/sport-complexes" className="navbar-link">
                    Sport Complexes
                </Link>
                <Link to="/facilities" className="navbar-link">
                    Facilities
                </Link>
                {isAuthenticated ? (
                    <>
                        <span className="navbar-user">Welcome, {user?.name}</span>
                        <Link to="/profile" className="navbar-link profile">
                            Profile
                        </Link>
                        <button onClick={handleLogout} className="navbar-link logout">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="navbar-link login">
                            Login
                        </Link>
                        <Link to="/register" className="navbar-link register">
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
