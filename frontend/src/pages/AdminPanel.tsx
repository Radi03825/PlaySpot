import { useState, useEffect } from "react";
import {
    getPendingFacilities,
    getPendingSportComplexes,
    verifyFacility,
    verifySportComplex,
    toggleFacilityStatus,
    toggleComplexStatus
} from "../services/api";
import type { FacilityDetails, SportComplex } from "../types";
import "../styles/AdminPanel.css";

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState<"facilities" | "complexes">("facilities");
    const [pendingFacilities, setPendingFacilities] = useState<FacilityDetails[]>([]);
    const [pendingComplexes, setPendingComplexes] = useState<SportComplex[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchPendingItems = async () => {
        setLoading(true);
        setError("");

        try {
            if (activeTab === "facilities") {
                const data = await getPendingFacilities();
                setPendingFacilities(data || []);
            } else {
                const data = await getPendingSportComplexes();
                setPendingComplexes(data || []);
            }
        } catch (err) {
            setError((err as Error).message || "Failed to load pending items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleVerifyFacility = async (facilityId: number) => {
        try {
            await verifyFacility(facilityId);
            setSuccess("Facility verified and activated successfully!");
            fetchPendingItems();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError((err as Error).message || "Failed to verify facility");
        }
    };

    const handleVerifyComplex = async (complexId: number) => {
        try {
            await verifySportComplex(complexId);
            setSuccess("Sport complex verified and activated successfully!");
            fetchPendingItems();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError((err as Error).message || "Failed to verify sport complex");
        }
    };

    const handleToggleFacilityStatus = async (facilityId: number, currentStatus: boolean) => {
        try {
            await toggleFacilityStatus(facilityId, !currentStatus);
            setSuccess(`Facility ${!currentStatus ? "activated" : "deactivated"} successfully!`);
            fetchPendingItems();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError((err as Error).message || "Failed to toggle facility status");
        }
    };

    const handleToggleComplexStatus = async (complexId: number, currentStatus: boolean) => {
        try {
            await toggleComplexStatus(complexId, !currentStatus);
            setSuccess(`Complex ${!currentStatus ? "activated" : "deactivated"} successfully!`);
            fetchPendingItems();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError((err as Error).message || "Failed to toggle complex status");
        }
    };

    return (
        <div className="admin-panel-container">
            <h1>Admin Panel</h1>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="admin-tabs">
                <button
                    className={activeTab === "facilities" ? "active" : ""}
                    onClick={() => setActiveTab("facilities")}
                >
                    Pending Facilities ({pendingFacilities.length})
                </button>
                <button
                    className={activeTab === "complexes" ? "active" : ""}
                    onClick={() => setActiveTab("complexes")}
                >
                    Pending Sport Complexes ({pendingComplexes.length})
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <div className="pending-items">
                    {activeTab === "facilities" ? (
                        pendingFacilities.length === 0 ? (
                            <p className="empty-message">No pending facilities to review</p>
                        ) : (
                            <div className="items-grid">
                                {pendingFacilities.map(facility => (
                                    <div key={facility.id} className="pending-card">
                                        <h3>{facility.name}</h3>
                                        <div className="card-details">
                                            <p><strong>Category:</strong> {facility.category_name}</p>
                                            <p><strong>Sport:</strong> {facility.sport_name}</p>
                                            <p><strong>Surface:</strong> {facility.surface_name}</p>
                                            <p><strong>Environment:</strong> {facility.environment_name}</p>
                                            <p><strong>Capacity:</strong> {facility.capacity}</p>
                                            <p><strong>Description:</strong> {facility.description}</p>
                                            {facility.sport_complex_name && (
                                                <p><strong>Complex:</strong> {facility.sport_complex_name}</p>
                                            )}
                                        </div>
                                        <div className="card-status">
                                            <span className={`status-badge ${facility.is_verified ? (facility.is_active ? "active" : "inactive") : "pending"}`}>
                                                {facility.is_verified ? (facility.is_active ? "Active" : "Inactive") : "Pending Verification"}
                                            </span>
                                        </div>
                                        <div className="card-actions">
                                            {!facility.is_verified ? (
                                                <button
                                                    className="btn-verify"
                                                    onClick={() => handleVerifyFacility(facility.id)}
                                                >
                                                    Verify & Activate
                                                </button>
                                            ) : (
                                                <button
                                                    className={facility.is_active ? "btn-deactivate" : "btn-activate"}
                                                    onClick={() => handleToggleFacilityStatus(facility.id, facility.is_active)}
                                                >
                                                    {facility.is_active ? "Deactivate" : "Activate"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        pendingComplexes.length === 0 ? (
                            <p className="empty-message">No pending sport complexes to review</p>
                        ) : (
                            <div className="items-grid">
                                {pendingComplexes.map(complex => (
                                    <div key={complex.id} className="pending-card">
                                        <h3>{complex.name}</h3>
                                        <div className="card-details">
                                            <p><strong>City:</strong> {complex.city}</p>
                                            <p><strong>Address:</strong> {complex.address}</p>
                                            <p><strong>Description:</strong> {complex.description}</p>
                                        </div>
                                        <div className="card-status">
                                            <span className={`status-badge ${complex.is_verified ? (complex.is_active ? "active" : "inactive") : "pending"}`}>
                                                {complex.is_verified ? (complex.is_active ? "Active" : "Inactive") : "Pending Verification"}
                                            </span>
                                        </div>
                                        <div className="card-actions">
                                            {!complex.is_verified ? (
                                                <button
                                                    className="btn-verify"
                                                    onClick={() => handleVerifyComplex(complex.id)}
                                                >
                                                    Verify & Activate
                                                </button>
                                            ) : (
                                                <button
                                                    className={complex.is_active ? "btn-deactivate" : "btn-activate"}
                                                    onClick={() => handleToggleComplexStatus(complex.id, complex.is_active)}
                                                >
                                                    {complex.is_active ? "Deactivate" : "Activate"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

