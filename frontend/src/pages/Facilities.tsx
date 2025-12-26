import { useEffect, useState } from "react";
import { getAllFacilities } from "../services/api";
import type { FacilityDetails } from "../types";
import FacilityCard from "../components/FacilityCard";
import "../styles/Facilities.css";

export default function Facilities() {
    const [facilities, setFacilities] = useState<FacilityDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSport, setSelectedSport] = useState<string>("all");

    useEffect(() => {
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        try {
            setLoading(true);
            const data = await getAllFacilities();
            setFacilities(data || []);
        } catch (err: any) {
            setError(err.message || "Failed to load facilities");
        } finally {
            setLoading(false);
        }
    };

    const getUniqueSports = () => {
        const sports = facilities.map(f => f.sport_name);
        return Array.from(new Set(sports)).sort();
    };

    const filteredFacilities = facilities.filter(facility => {
        const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            facility.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSport = selectedSport === "all" || facility.sport_name === selectedSport;
        return matchesSearch && matchesSport;
    });

    if (loading) {
        return (
            <div className="facilities-container">
                <div className="loading">Loading facilities...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="facilities-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="facilities-container">
            <div className="facilities-header">
                <h1>All Facilities</h1>
                <p>Browse and book sport facilities across Bulgaria</p>
            </div>

            <div className="facilities-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search facilities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-box">
                    <label>Filter by Sport:</label>
                    <select
                        value={selectedSport}
                        onChange={(e) => setSelectedSport(e.target.value)}
                    >
                        <option value="all">All Sports</option>
                        {getUniqueSports().map(sport => (
                            <option key={sport} value={sport}>
                                {sport}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="facilities-grid">
                {filteredFacilities.length === 0 ? (
                    <div className="no-data">No facilities found</div>
                ) : (
                    filteredFacilities.map((facility) => (
                        <FacilityCard key={facility.id} facility={facility} />
                    ))
                )}
            </div>
        </div>
    );
}

