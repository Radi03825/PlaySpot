import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSportComplexById, getFacilitiesByComplexId } from "../services/api";
import type { SportComplex, FacilityDetails } from "../types";
import FacilityCard from "../components/FacilityCard";
import "../styles/SportComplexDetails.css";

export default function SportComplexDetails() {
    const { id } = useParams<{ id: string }>();
    const [complex, setComplex] = useState<SportComplex | null>(null);
    const [facilities, setFacilities] = useState<FacilityDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (id) {
            fetchComplexDetails(parseInt(id));
            fetchFacilities(parseInt(id));
        }
    }, [id]);

    const fetchComplexDetails = async (complexId: number) => {
        try {
            const data = await getSportComplexById(complexId);
            setComplex(data);
        } catch (err: any) {
            setError(err.message || "Failed to load sport complex details");
        }
    };

    const fetchFacilities = async (complexId: number) => {
        try {
            setLoading(true);
            const data = await getFacilitiesByComplexId(complexId);
            setFacilities(data || []);
        } catch (err: any) {
            setError(err.message || "Failed to load facilities");
        } finally {
            setLoading(false);
        }
    };

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
    }

    return (
        <div className="sport-complex-details-container">
            <div className="complex-info-section">
                <div className="complex-header">
                    <h1>{complex.name}</h1>
                    {complex.is_verified && (
                        <span className="verified-badge">✓ Verified</span>
                    )}
                </div>

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
        </div>
    );
}

