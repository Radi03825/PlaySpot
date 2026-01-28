import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllSportComplexes, getEntityImages } from "../services/api";
import type { SportComplex } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../styles/SportComplexes.css";
import {faCircleCheck} from "@fortawesome/free-solid-svg-icons";

export default function SportComplexes() {
    const [complexes, setComplexes] = useState<SportComplex[]>([]);
    const [complexImages, setComplexImages] = useState<{[key: number]: string}>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchSportComplexes();
    }, []);    const fetchSportComplexes = async () => {
        try {
            setLoading(true);
            const data = await getAllSportComplexes();
            setComplexes(data || []);
            
            // Fetch images for each complex
            const imagePromises = (data || []).map(async (complex: SportComplex) => {
                try {
                    const images = await getEntityImages('sport_complex', complex.id);
                    if (images && images.length > 0) {
                        const primary = images.find((img: any) => img.is_primary) || images[0];
                        return { id: complex.id, url: primary.url };
                    }
                } catch (err) {
                    console.error(`Failed to load image for complex ${complex.id}:`, err);
                }
                return null;
            });
            
            const imageResults = await Promise.all(imagePromises);
            const imageMap: {[key: number]: string} = {};
            imageResults.forEach(result => {
                if (result) {
                    imageMap[result.id] = result.url;
                }
            });
            setComplexImages(imageMap);
        } catch (err: any) {
            setError(err.message || "Failed to load sport complexes");
        } finally {
            setLoading(false);
        }
    };

    const handleComplexClick = (id: number) => {
        navigate(`/sport-complexes/${id}`);
    };

    if (loading) {
        return (
            <div className="sport-complexes-container">
                <div className="loading">Loading sport complexes...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sport-complexes-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="sport-complexes-container">
            <div className="sport-complexes-header">
                <h1>Sport Complexes</h1>
                <p>Explore our premium sport facilities across Bulgaria</p>
            </div>

            <div className="sport-complexes-grid">
                {complexes.length === 0 ? (
                    <div className="no-data">No sport complexes available</div>
                ) : (                    complexes.map((complex) => (
                        <div
                            key={complex.id}
                            className="complex-card"
                            onClick={() => handleComplexClick(complex.id)}
                        >
                            <div className="complex-card-header">
                                <h3>{complex.name}</h3>
                                {complex.is_verified && (
                                    <span className="verified-badge" title="Verified: Safe to use">
                                        <FontAwesomeIcon icon={faCircleCheck} />
                                    </span>
                                )}
                            </div>
                            
                            {complexImages[complex.id] && (
                                <div className="complex-card-image">
                                    <img src={complexImages[complex.id]} alt={complex.name} />
                                </div>
                            )}
                            
                            <div className="complex-card-body">
                                <p className="complex-location">
                                    <span className="icon">📍</span>
                                    {complex.city}
                                </p>
                                <p className="complex-address">{complex.address}</p>
                                {complex.description && (
                                    <p className="complex-description">
                                        {complex.description}
                                    </p>
                                )}
                            </div>
                            <div className="complex-card-footer">
                                <button className="view-details-btn">
                                    View Details →
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

