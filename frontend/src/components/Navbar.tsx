import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faUser, faArrowRightFromBracket, faPeopleRoof } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import "../styles/Navbar.css";

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/");
        setIsMenuOpen(false);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
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
                <Link to="/events" className="navbar-link">
                    Events
                </Link>
                {isAuthenticated ? (
                    <>
                        {user?.role_id === 1 && (
                            <Link to="/admin" className="navbar-link admin">
                                Admin Panel
                            </Link>
                        )}                        {user?.role_id === 3 && (
                            <Link to="/manage-facilities" className="navbar-link manage">
                                Manage Facilities
                            </Link>
                        )}
                        <Link to="/my-activity" className="navbar-link bookings">
                            My Activity
                        </Link>
                        <div className="navbar-menu-container">
                            <button onClick={toggleMenu} className="navbar-menu-button" aria-label="Menu">
                                <FontAwesomeIcon icon={faBars} />
                            </button>
                            {isMenuOpen && (
                                <>
                                    <div className="navbar-menu-overlay" onClick={closeMenu}></div>
                                    <div className="navbar-menu-dropdown">
                                        <Link to="/profile" className="navbar-menu-item" onClick={closeMenu}>
                                            <FontAwesomeIcon icon={faUser} />
                                            <span>Profile</span>
                                        </Link>
                                        {user?.role_id === 2 && (
                                            <Link to="/become-manager" className="navbar-menu-item" onClick={closeMenu}>
                                                <FontAwesomeIcon icon={faPeopleRoof} />
                                                <span>Become Manager</span>
                                            </Link>
                                        )}
                                        <button onClick={handleLogout} className="navbar-menu-item">
                                            <FontAwesomeIcon icon={faArrowRightFromBracket} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="navbar-link signin">
                            Sign in
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
