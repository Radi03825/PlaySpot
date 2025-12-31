import { useNavigate } from "react-router-dom";
import type { FacilityDetails } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import "../styles/FacilityCard.css";

interface FacilityCardProps {
    facility: FacilityDetails;
}

const FacilityCard = ({ facility }: FacilityCardProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/facilities/${facility.id}`);
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
            </div>

            <div className="facility-card-footer">
                <button className="view-btn">View Details →</button>
            </div>
        </div>
    );
};

export default FacilityCard;

