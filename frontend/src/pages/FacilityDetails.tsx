import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFacilityById, getEntityImages, toggleFacilityStatus } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { FacilityDetails } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BookingModal from "../components/BookingModal";
import ImageModal from "../components/ImageModal";
import "../styles/FacilityDetails.css";
import {faCircleCheck} from "@fortawesome/free-solid-svg-icons";

interface Image {
    id: number;
    url: string;
    is_primary: boolean;
}

export default function FacilityDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [facility, setFacility] = useState<FacilityDetails | null>(null);
    const [images, setImages] = useState<Image[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const [facilityData, imagesData] = await Promise.all([
                    getFacilityById(parseInt(id)),
                    getEntityImages('facility', parseInt(id))
                ]);

                if (isMounted) {
                    setFacility(facilityData);
                    setImages(imagesData || []);
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
        // Redirect to My Bookings page with success indicator
        navigate('/my-activity?new=true');
    };    const handleToggleStatus = async () => {
        if (!facility || !user) return;
        
        const action = facility.is_active ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this facility?`)) {
            return;
        }

        try {
            setTogglingStatus(true);
            await toggleFacilityStatus(facility.id, !facility.is_active);
            
            // Refresh facility data
            const facilityData = await getFacilityById(parseInt(id!));
            setFacility(facilityData);
            setError("");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to toggle facility status";
            setError(errorMessage);
        } finally {
            setTogglingStatus(false);
        }
    };

    const isAdmin = user?.role_id === 1;
    const isOwner = user && facility?.manager_id === user.id;

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
            <div className="facility-title-section">
                <h1>{facility.name}</h1>
                {facility.is_verified && (
                    <span className="verified-badge" title="Verified: Safe to use">
                        <FontAwesomeIcon icon={faCircleCheck} />
                    </span>
                )}
            </div>            {/* Admin Controls */}
            {isAdmin && (
                <div className="admin-controls" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>Admin Controls:</span>
                        <span style={{ 
                            padding: '5px 12px', 
                            borderRadius: '5px', 
                            backgroundColor: facility.is_active ? '#d4edda' : '#f8d7da',
                            color: facility.is_active ? '#155724' : '#721c24',
                            fontWeight: 'bold'
                        }}>
                            {facility.is_active ? '✓ Active' : '✗ Inactive'}
                        </span>
                        <button
                            onClick={handleToggleStatus}
                            disabled={togglingStatus}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: facility.is_active ? '#dc3545' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: togglingStatus ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                opacity: togglingStatus ? 0.6 : 1
                            }}
                        >
                            {togglingStatus ? 'Processing...' : facility.is_active ? 'Deactivate Facility' : 'Activate Facility'}
                        </button>
                    </div>
                    {!facility.is_active && (
                        <p style={{ marginTop: '10px', color: '#856404', fontSize: '14px' }}>
                            ⚠️ This facility is currently deactivated and not visible to users in the facilities list.
                        </p>
                    )}
                </div>
            )}

            {/* Owner Controls */}
            {isOwner && !isAdmin && (
                <div className="owner-controls" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>Owner Controls:</span>
                        <button
                            onClick={() => navigate(`/facilities/${id}/edit`)}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            ✏️ Edit Facility
                        </button>
                    </div>
                </div>
            )}

            {/* Image Gallery */}
            {images.length > 0 && (
                <div className="facility-gallery">
                    <div className="main-image" onClick={() => setShowImageModal(true)}>
                        <img 
                            src={images[selectedImageIndex]?.url || images[0].url} 
                            alt={`${facility.name} - Image ${selectedImageIndex + 1}`}
                        />
                        <div className="image-overlay">
                            <span className="zoom-icon">🔍 Click to view full size</span>
                        </div>
                    </div>
                    {images.length > 1 && (
                        <div className="thumbnail-strip">
                            {images.map((image, index) => (
                                <div
                                    key={image.id}
                                    className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                                    onClick={() => setSelectedImageIndex(index)}
                                >
                                    <img src={image.url} alt={`Thumbnail ${index + 1}`} />
                                    {image.is_primary && <span className="primary-badge">Primary</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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

                    {isAdmin && (
                        <div className="admin-actions">
                            <button 
                                className="toggle-status-btn" 
                                onClick={handleToggleStatus} 
                                disabled={togglingStatus}
                            >
                                {togglingStatus ? "Processing..." : facility.is_active ? "Deactivate" : "Activate"}
                            </button>
                        </div>
                    )}
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

            {showImageModal && images.length > 0 && facility && (
                <ImageModal
                    imageUrl={images[selectedImageIndex].url}
                    altText={`${facility.name} - Image ${selectedImageIndex + 1}`}
                    onClose={() => setShowImageModal(false)}
                />
            )}
        </div>
    );
}

