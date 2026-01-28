import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSportComplexById, getFacilitiesByComplexId, getEntityImages, toggleComplexStatus } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { SportComplex, FacilityDetails } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import FacilityCard from "../components/FacilityCard";
import ImageModal from "../components/ImageModal";
import "../styles/SportComplexDetails.css";

interface Image {
    id: number;
    url: string;
    is_primary: boolean;
}

export default function SportComplexDetails() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [complex, setComplex] = useState<SportComplex | null>(null);
    const [facilities, setFacilities] = useState<FacilityDetails[]>([]);
    const [images, setImages] = useState<Image[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [togglingStatus, setTogglingStatus] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const complexId = parseInt(id);

                const [complexData, facilitiesData, imagesData] = await Promise.all([
                    getSportComplexById(complexId),
                    getFacilitiesByComplexId(complexId),
                    getEntityImages('sport_complex', complexId)
                ]);

                if (isMounted) {
                    setComplex(complexData);
                    setFacilities(facilitiesData || []);
                    setImages(imagesData || []);
                    setError("");
                }
            } catch (err: unknown) {
                if (isMounted) {
                    const errorMessage = err instanceof Error ? err.message : "Failed to load sport complex details";
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

    const handleToggleStatus = async () => {
        if (!complex || !user) return;
        
        const action = complex.is_active ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this sport complex?`)) {
            return;
        }

        try {
            setTogglingStatus(true);
            await toggleComplexStatus(complex.id, !complex.is_active);
            
            // Refresh complex data
            const complexData = await getSportComplexById(parseInt(id!));
            setComplex(complexData);
            setError("");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to toggle complex status";
            setError(errorMessage);
        } finally {
            setTogglingStatus(false);
        }
    };

    const isAdmin = user?.role_id === 1;

    if (loading) {
        return (
            <div className="sport-complex-details-container">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sport-complex-details-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    if (!complex) {
        return (
            <div className="sport-complex-details-container">
                <div className="error">Sport complex not found</div>
            </div>
        );
    }    return (
        <div className="sport-complex-details-container">
            <div className="complex-title-section">
                <h1>{complex.name}</h1>
                {complex.is_verified && (
                    <span className="verified-badge" title="Verified: Safe to use">
                        <FontAwesomeIcon icon={faCircleCheck} />
                    </span>
                )}
            </div>

            {/* Admin Controls */}
            {isAdmin && (
                <div className="admin-controls" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>Admin Controls:</span>
                        <span style={{ 
                            padding: '5px 12px', 
                            borderRadius: '5px', 
                            backgroundColor: complex.is_active ? '#d4edda' : '#f8d7da',
                            color: complex.is_active ? '#155724' : '#721c24',
                            fontWeight: 'bold'
                        }}>
                            {complex.is_active ? '✓ Active' : '✗ Inactive'}
                        </span>
                        <button
                            onClick={handleToggleStatus}
                            disabled={togglingStatus}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: complex.is_active ? '#dc3545' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: togglingStatus ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                opacity: togglingStatus ? 0.6 : 1
                            }}
                        >
                            {togglingStatus ? 'Processing...' : complex.is_active ? 'Deactivate Complex' : 'Activate Complex'}
                        </button>
                    </div>
                    {!complex.is_active && (
                        <p style={{ marginTop: '10px', color: '#856404', fontSize: '14px' }}>
                            ⚠️ This sport complex is currently deactivated and not visible to users in the complexes list.
                        </p>
                    )}
                </div>
            )}

            {/* Image Gallery */}
            {images.length > 0 && (
                <div className="complex-gallery">
                    <div className="main-image" onClick={() => setShowImageModal(true)}>
                        <img 
                            src={images[selectedImageIndex]?.url || images[0].url} 
                            alt={`${complex.name} - Image ${selectedImageIndex + 1}`}
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

            <div className="complex-info-section">
                <div className="complex-details">
                    <div className="detail-item">
                        <span className="icon">📍</span>
                        <div>
                            <strong>Location</strong>
                            <p>{complex.city}</p>
                        </div>
                    </div>

                    <div className="detail-item">
                        <span className="icon">🏢</span>
                        <div>
                            <strong>Address</strong>
                            <p>{complex.address}</p>
                        </div>
                    </div>
                </div>

                {complex.description && (
                    <div className="complex-description">
                        <h3>About</h3>
                        <p>{complex.description}</p>
                    </div>
                )}
            </div>

            <div className="facilities-section">
                <h2>Available Facilities</h2>

                {facilities.length === 0 ? (
                    <div className="no-data">
                        No facilities available at this complex
                    </div>
                ) : (
                    <div className="facilities-grid">
                        {facilities.map((facility) => (
                            <FacilityCard key={facility.id} facility={facility} />
                        ))}
                    </div>
                )}
            </div>

            {showImageModal && images.length > 0 && (
                <ImageModal
                    imageUrl={images[selectedImageIndex].url}
                    altText={`${complex.name} - Image ${selectedImageIndex + 1}`}
                    onClose={() => setShowImageModal(false)}
                />
            )}
        </div>
    );
}

