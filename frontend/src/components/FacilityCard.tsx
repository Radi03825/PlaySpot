import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import type { FacilityDetails } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { getEntityImages } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/FacilityCard.css";

interface FacilityCardProps {
    facility: FacilityDetails;
}

const FacilityCard = ({ facility }: FacilityCardProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [primaryImage, setPrimaryImage] = useState<string | null>(null);

    const isOwner = user && facility.manager_id === user.id;

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const images = await getEntityImages('facility', facility.id);
                if (images && images.length > 0) {
                    // Find primary image or use first one
                    const primary = images.find((img: any) => img.is_primary) || images[0];
                    setPrimaryImage(primary.url);
                }
            } catch (err) {
                console.error('Failed to load facility image:', err);
            }
        };

        fetchImage();
    }, [facility.id]);    const handleClick = () => {
        navigate(`/facilities/${facility.id}`);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/facilities/${facility.id}/edit`);
    };

    return (
        <div className="facility-card" onClick={handleClick}>
            <div className="facility-card-header">
                <h3>{facility.name}</h3>
                {facility.is_verified && (
                    <span className="verified-badge-small" title="Verified: Safe to use">
                        <FontAwesomeIcon icon={faCircleCheck} />
                    </span>
                )}
            </div>
            
            {primaryImage && (
                <div className="facility-card-image">
                    <img src={primaryImage} alt={facility.name} />
                </div>
            )}

            <div className="facility-card-body">
                <div className="facility-tags">
                    <span className="tag sport-tag">{facility.sport_name}</span>
                    <span className="tag category-tag">{facility.category_name}</span>
                </div>

                <p className="facility-description">{facility.description}</p>

                <div className="facility-info">
                    <div className="info-item">
                        <span className="info-icon">🏃</span>
                        <span>{facility.surface_name}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🏢</span>
                        <span>{facility.environment_name}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">👥</span>
                        <span>{facility.capacity} capacity</span>
                    </div>
                </div>

                {facility.sport_complex_name && (
                    <p className="facility-complex">
                        <span className="icon">📍</span>
                        {facility.sport_complex_name}
                    </p>
                )}
            </div>            <div className="facility-card-footer">
                {isOwner && (
                    <button 
                        className="edit-btn" 
                        onClick={handleEditClick}
                        title="Edit this facility"
                    >
                        ✏️ Edit
                    </button>
                )}
                <button className="view-btn">View Details →</button>
            </div>
        </div>
    );
};

export default FacilityCard;

