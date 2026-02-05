import { useEffect, useState } from "react";
import { facilityService, metadataService } from "../api";
import type { FacilityDetails } from "../types";
import FacilityCard from "../components/FacilityCard";
import "../styles/Facilities.css";

interface Surface {
    id: number;
    name: string;
    description: string;
}

interface Environment {
    id: number;
    name: string;
    description: string;
}

interface Sport {
    id: number;
    name: string;
}

export default function Facilities() {
    const [facilities, setFacilities] = useState<FacilityDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedSport, setSelectedSport] = useState<string>("");
    const [selectedSurface, setSelectedSurface] = useState<string>("");
    const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
    const [minCapacity, setMinCapacity] = useState<string>("");
    const [maxCapacity, setMaxCapacity] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<string>("asc");    // Metadata states
    const [cities, setCities] = useState<string[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [surfaces, setSurfaces] = useState<Surface[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);

    useEffect(() => {
        fetchMetadata();
        fetchFacilities();
    }, []);    const fetchMetadata = async () => {
        try {
            const [citiesData, sportsData, surfacesData, environmentsData] = await Promise.all([
                metadataService.getCities(),
                metadataService.getSports(),
                metadataService.getSurfaces(),
                metadataService.getEnvironments(),
            ]);
            setCities(citiesData || []);
            setSports(sportsData || []);
            setSurfaces(surfacesData || []);
            setEnvironments(environmentsData || []);
        } catch (err: any) {
            console.error("Failed to load metadata:", err);
        }
    };

    const fetchFacilities = async () => {
        try {
            setLoading(true);
            const params: any = {};

            if (selectedCity) params.city = selectedCity;
            if (selectedSport) params.sport = selectedSport;
            if (selectedSurface) params.surface = selectedSurface;
            if (selectedEnvironment) params.environment = selectedEnvironment;
            if (minCapacity) params.min_capacity = parseInt(minCapacity);
            if (maxCapacity) params.max_capacity = parseInt(maxCapacity);            if (sortBy) {
                params.sort_by = sortBy;
                params.sort_order = sortOrder;
            }

            const data = await facilityService.search(params);
            setFacilities(data || []);
        } catch (err: any) {
            setError(err.message || "Failed to load facilities");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchFacilities();
        }, 300); // Debounce search

        return () => clearTimeout(timer);    }, [selectedCity, selectedSport, selectedSurface, selectedEnvironment, minCapacity, maxCapacity, sortBy, sortOrder]);

    const filteredFacilities = facilities.filter(facility => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return facility.name.toLowerCase().includes(term) ||
               facility.description.toLowerCase().includes(term) ||
               facility.sport_complex_name?.toLowerCase().includes(term) ||
               facility.city?.toLowerCase().includes(term);
    });

    const handleClearFilters = () => {
        setSelectedCity("");
        setSelectedSport("");
        setSelectedSurface("");
        setSelectedEnvironment("");
        setMinCapacity("");
        setMaxCapacity("");
        setSortBy("");
        setSortOrder("asc");
        setSearchTerm("");
    };

    if (loading && facilities.length === 0) {
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
                        placeholder="Search by name, description, complex, or city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filters-grid">
                    <div className="filter-box">
                        <label>City:</label>
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                        >
                            <option value="">All Cities</option>
                            {cities.map(city => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </div>                    <div className="filter-box">
                        <label>Sport:</label>
                        <select
                            value={selectedSport}
                            onChange={(e) => setSelectedSport(e.target.value)}
                        >
                            <option value="">All Sports</option>
                            {sports.map(sport => (
                                <option key={sport.id} value={sport.name}>
                                    {sport.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-box">
                        <label>Surface:</label>
                        <select
                            value={selectedSurface}
                            onChange={(e) => setSelectedSurface(e.target.value)}
                        >
                            <option value="">All Surfaces</option>
                            {surfaces.map(surface => (
                                <option key={surface.id} value={surface.name}>
                                    {surface.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-box">
                        <label>Environment:</label>
                        <select
                            value={selectedEnvironment}
                            onChange={(e) => setSelectedEnvironment(e.target.value)}
                        >
                            <option value="">All Environments</option>
                            {environments.map(env => (
                                <option key={env.id} value={env.name}>
                                    {env.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-box">
                        <label>Min Capacity:</label>
                        <input
                            type="number"
                            placeholder="Min"
                            value={minCapacity}
                            onChange={(e) => setMinCapacity(e.target.value)}
                            min="0"
                        />
                    </div>

                    <div className="filter-box">
                        <label>Max Capacity:</label>
                        <input
                            type="number"
                            placeholder="Max"
                            value={maxCapacity}
                            onChange={(e) => setMaxCapacity(e.target.value)}
                            min="0"
                        />
                    </div>

                    <div className="filter-box">
                        <label>Sort By:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="">Default</option>
                            <option value="name">Name</option>
                            <option value="city">City</option>
                            <option value="capacity">Capacity</option>
                            <option value="sport">Sport</option>
                        </select>
                    </div>

                    <div className="filter-box">
                        <label>Order:</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            disabled={!sortBy}
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>
                </div>

                <div className="filter-actions">
                    <button className="clear-filters-btn" onClick={handleClearFilters}>
                        Clear All Filters
                    </button>
                    <span className="results-count">
                        {filteredFacilities.length} {filteredFacilities.length === 1 ? 'facility' : 'facilities'} found
                    </span>
                </div>
            </div>

            <div className="facilities-grid">
                {filteredFacilities.length === 0 ? (
                    <div className="no-data">No facilities found matching your criteria</div>
                ) : (
                    filteredFacilities.map((facility) => (
                        <FacilityCard key={facility.id} facility={facility} />
                    ))
                )}
            </div>
        </div>
    );
}

