import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFacilityById } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { FacilityDetails } from "../types";
import BookingModal from "../components/BookingModal";
import "../styles/FacilityDetails.css";

export default function FacilityDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [facility, setFacility] = useState<FacilityDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const data = await getFacilityById(parseInt(id));

                if (isMounted) {
                    setFacility(data);
                    setError("");
                }
            } catch (err: unknown) {
                if (isMounted) {
                    const errorMessage = err instanceof Error ? err.message : "Failed to load facility details";
                    setError(errorMessage);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [id]);

    const handleBookNow = () => {
        if (!isAuthenticated) {
            navigate("/login");
        } else {
            setShowBookingModal(true);
        }
    };

    const handleBookingSuccess = () => {
        alert("Booking successful! Check your reservations in your profile.");
    };

    if (loading) {
        return (
            <div className="facility-details-container">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="facility-details-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    if (!facility) {
        return (
            <div className="facility-details-container">
                <div className="error">Facility not found</div>
            </div>
        );
    }

    return (
        <div className="facility-details-container">
            <div className="facility-hero">
                <h1>{facility.name}</h1>
                {facility.is_verified && (
                    <span className="verified-badge">✓ Verified</span>
                )}
            </div>

            <div className="facility-content">
                <div className="facility-main-info">
                    <div className="info-card">
                        <h3>Description</h3>
                        <p>{facility.description}</p>
                    </div>

                    <div className="facility-specs">
                        <div className="spec-item">
                            <span className="spec-label">Sport</span>
                            <span className="spec-value">{facility.sport_name}</span>
                        </div>

                        <div className="spec-item">
                            <span className="spec-label">Category</span>
                            <span className="spec-value">{facility.category_name}</span>
                        </div>

                        <div className="spec-item">
                            <span className="spec-label">Surface</span>
                            <span className="spec-value">{facility.surface_name}</span>
                        </div>

                        <div className="spec-item">
                            <span className="spec-label">Environment</span>
                            <span className="spec-value">{facility.environment_name}</span>
                        </div>

                        <div className="spec-item">
                            <span className="spec-label">Capacity</span>
                            <span className="spec-value">{facility.capacity} people</span>
                        </div>

                        {facility.sport_complex_name && (
                            <div className="spec-item">
                                <span className="spec-label">Complex</span>
                                <span className="spec-value">{facility.sport_complex_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="facility-sidebar">
                    <div className="booking-card">
                        <h3>Book This Facility</h3>
                        <p className="booking-info">
                            Contact us to book this facility for your next event or training session.
                        </p>
                        <button className="book-btn" onClick={handleBookNow}>Book Now</button>
                    </div>
                </div>
            </div>

            {showBookingModal && facility && (
                <BookingModal
                    facilityId={facility.id}
                    facilityName={facility.name}
                    onClose={() => setShowBookingModal(false)}
                    onSuccess={handleBookingSuccess}
                />
            )}
        </div>
    );
}

