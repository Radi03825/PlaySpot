import { useState, useEffect } from "react";
import {
    getMySportComplexes,
    getMyFacilities
} from "../services/api";
import type { SportComplex, FacilityDetails } from "../types";
import CreateSportComplexForm from "../components/CreateSportComplexForm";
import CreateFacilityForm from "../components/CreateFacilityForm";
import "../styles/BecomeManager.css";

export default function BecomeManager() {
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
        setSuccess(message + " Once approved, you will be upgraded to a Manager!");
        setError("");
        setShowCreateForm(false);
        fetchData();
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

    const hasPendingItems = () => {
        const pendingComplexes = mySportComplexes.filter(c => !c.is_verified);
        const pendingFacilities = myFacilities.filter(f => !f.is_verified);
        return pendingComplexes.length > 0 || pendingFacilities.length > 0;
    };

    return (
        <div className="become-manager-container">
            <div className="become-manager-header">
                <h1>Become a Facility Manager</h1>
                <p className="header-subtitle">
                    Register your sports facilities and start earning! Once your submission is approved by our admin team,
                    you will be upgraded to a Manager account with full access to facility management tools.
                </p>
            </div>

            <div className="info-section">
                <h2>Why Become a Manager?</h2>
                <div className="benefits-grid">
                    <div className="benefit-card">
                        <div className="benefit-icon">📍</div>
                        <h3>List Your Facilities</h3>
                        <p>Add your sports complexes and facilities to our platform</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">👥</div>
                        <h3>Reach More Customers</h3>
                        <p>Connect with sports enthusiasts looking for venues</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">⚙️</div>
                        <h3>Manage Your Listings</h3>
                        <p>Update details, availability, and pricing easily</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">📊</div>
                        <h3>Track Performance</h3>
                        <p>Monitor your bookings and customer engagement</p>
                    </div>
                </div>
            </div>            <div className="action-section">
                <h2>Get Started</h2>
                <p>Submit your sport complex or facility for review. Our team will verify it within 24-48 hours.</p>
                
                <div className="requirements-box">
                    <h3>📋 What You'll Need:</h3>
                    <ul className="requirements-list">
                        <li>Basic facility information (name, location, capacity)</li>
                        <li>Facility characteristics (sport type, surface, environment)</li>
                        <li>Photos of your facility (at least 1 image required)</li>
                        <li><strong>Working hours</strong> (when your facility is open)</li>
                        <li><strong>Pricing structure</strong> (hourly rates for different time slots)</li>
                    </ul>
                    <p className="requirements-note">
                        💡 <strong>Tip:</strong> You can set different working hours and pricing for weekdays and weekends!
                    </p>
                </div>

                <button
                    className="btn-primary btn-large"
                    onClick={openCreateModal}
                >
                    + Add Your First Facility
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {hasPendingItems() && (
                <div className="waiting-list-section">
                    <h2>Your Waiting List</h2>
                    <p className="section-description">
                        These items are waiting for admin approval. You will be notified once they are verified!
                    </p>

                    {mySportComplexes.filter(c => !c.is_verified).length > 0 && (
                        <>
                            <h3>Pending Sport Complexes</h3>
                            <div className="complexes-grid">
                                {mySportComplexes.filter(c => !c.is_verified).map(complex => (
                                    <div key={complex.id} className="complex-card">
                                        <h3>{complex.name}</h3>
                                        <p>{complex.city}, {complex.address}</p>
                                        <p>{complex.description}</p>
                                        {getStatusBadge(complex.is_verified, complex.is_active)}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {myFacilities.filter(f => !f.is_verified).length > 0 && (
                        <>
                            <h3>Pending Facilities</h3>
                            <div className="facilities-grid">
                                {myFacilities.filter(f => !f.is_verified).map(facility => (
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
                        </>
                    )}
                </div>
            )}

            {showCreateForm && (
                <div className="modal-overlay" onClick={closeCreateModal}>                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeCreateModal}>×</button>

                        <h2>Add Your Facility</h2>
                          <div className="wizard-info">
                            <p>Complete the following steps to register your facility:</p>
                            <ol className="wizard-steps-info">
                                <li>Basic Information (name, sport, location)</li>
                                <li>Characteristics (surface, environment, description)</li>
                                <li><strong>Working Hours & Pricing</strong></li>
                                <li>Photos (minimum 1 image)</li>
                                <li>Review & Submit</li>
                            </ol>
                        </div>

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
                            </button>                        </div>{createType === "complex" ? (
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

