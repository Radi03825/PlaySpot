import { useState, useEffect } from "react";
import {
    getMySportComplexes,
    getMyFacilities
} from "../services/api";
import type { SportComplex, FacilityDetails } from "../types";
import CreateSportComplexForm from "../components/CreateSportComplexForm";
import CreateFacilityForm from "../components/CreateFacilityForm";
import "../styles/ManageFacilities.css";

export default function ManageFacilities() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createType, setCreateType] = useState<"complex" | "facility">("complex");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [mySportComplexes, setMySportComplexes] = useState<SportComplex[]>([]);
    const [myFacilities, setMyFacilities] = useState<FacilityDetails[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [complexes, facilities] = await Promise.all([
                getMySportComplexes(),
                getMyFacilities()
            ]);

            setMySportComplexes(complexes || []);
            setMyFacilities(facilities || []);
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError("Failed to load your facilities");
        }
    };

    const openCreateModal = () => {
        setError("");
        setSuccess("");
        setShowCreateForm(true);
    };

    const closeCreateModal = () => {
        setError("");
        setSuccess("");
        setShowCreateForm(false);
    };

    const handleTypeChange = (type: "complex" | "facility") => {
        setError("");
        setSuccess("");
        setCreateType(type);
    };

    const handleSuccess = (message: string) => {
        setSuccess(message);
        setError("");
        setShowCreateForm(false);
        fetchData(); // Refresh the list
    };

    const handleError = (message: string) => {
        setError(message);
        setSuccess("");
    };

    const getStatusBadge = (isVerified: boolean, isActive: boolean) => {
        if (isVerified && isActive) {
            return <span className="status-badge active">Active</span>;
        } else if (isVerified && !isActive) {
            return <span className="status-badge inactive">Inactive</span>;
        } else {
            return <span className="status-badge pending">Pending Approval</span>;
        }
    };

    return (
        <div className="manage-facilities-container">
            <div className="manage-header">
                <h1>Manage My Facilities</h1>
                <button
                    className="btn-primary"
                    onClick={openCreateModal}
                >
                    + Create New
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* List of my facilities */}
            <div className="facilities-list">
                <h2>My Sport Complexes</h2>
                {!mySportComplexes || mySportComplexes.length === 0 ? (
                    <p className="empty-message">No sport complexes yet. Create one to get started!</p>
                ) : (
                    <div className="complexes-grid">
                        {mySportComplexes.map(complex => (
                            <div key={complex.id} className="complex-card">
                                <h3>{complex.name}</h3>
                                <p>{complex.city}, {complex.address}</p>
                                <p>{complex.description}</p>
                                {getStatusBadge(complex.is_verified, complex.is_active)}
                            </div>
                        ))}
                    </div>
                )}

                <h2>My Standalone Facilities</h2>
                {!myFacilities || myFacilities.filter(f => !f.sport_complex_id).length === 0 ? (
                    <p className="empty-message">No standalone facilities yet.</p>
                ) : (
                    <div className="facilities-grid">
                        {myFacilities.filter(f => !f.sport_complex_id).map(facility => (
                            <div key={facility.id} className="facility-card">
                                <h3>{facility.name}</h3>
                                <p className="facility-category">{facility.category_name}</p>
                                <p>{facility.description}</p>
                                <p className="facility-details">
                                    Capacity: {facility.capacity} | {facility.surface_name} | {facility.environment_name}
                                </p>
                                {getStatusBadge(facility.is_verified, facility.is_active)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Form Modal */}
            {showCreateForm && (
                <div className="modal-overlay" onClick={closeCreateModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeCreateModal}>x</button>

                        <h2>Create New</h2>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <div className="create-type-selector">
                            <button
                                className={createType === "complex" ? "active" : ""}
                                onClick={() => handleTypeChange("complex")}
                            >
                                Sport Complex
                            </button>
                            <button
                                className={createType === "facility" ? "active" : ""}
                                onClick={() => handleTypeChange("facility")}
                            >
                                Standalone Facility
                            </button>
                        </div>

                        {createType === "complex" ? (
                            <CreateSportComplexForm
                                onSuccess={handleSuccess}
                                onError={handleError}
                                onCancel={closeCreateModal}
                            />
                        ) : (
                            <CreateFacilityForm
                                onSuccess={handleSuccess}
                                onError={handleError}
                                onCancel={closeCreateModal}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
