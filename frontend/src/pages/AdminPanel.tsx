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
import AdminDetailModal from "../components/AdminDetailModal";
import ImageViewerModal from "../components/ImageViewerModal";
import "../styles/AdminPanel.css";

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState<"facilities" | "complexes">("facilities");
    const [pendingFacilities, setPendingFacilities] = useState<FacilityDetails[]>([]);
    const [pendingComplexes, setPendingComplexes] = useState<SportComplex[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");    const [success, setSuccess] = useState("");
    const [selectedItem, setSelectedItem] = useState<FacilityDetails | SportComplex | null>(null);
    const [modalType, setModalType] = useState<"facility" | "complex" | null>(null);
    const [viewerImages, setViewerImages] = useState<{ url: string; is_primary: boolean }[]>([]);
    const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
    const [showImageViewer, setShowImageViewer] = useState(false);

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
    }, [activeTab]);    const handleVerifyFacility = async (facilityId: number) => {
        try {
            await verifyFacility(facilityId);
            setSuccess("Facility verified and activated successfully!");
            setSelectedItem(null);
            setModalType(null);
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
            setSelectedItem(null);
            setModalType(null);
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
            setSelectedItem(null);
            setModalType(null);
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
            setSelectedItem(null);
            setModalType(null);
            fetchPendingItems();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError((err as Error).message || "Failed to toggle complex status");
        }
    };    const openDetailModal = (item: FacilityDetails | SportComplex, type: "facility" | "complex") => {
        setSelectedItem(item);
        setModalType(type);
    };

    const openImageViewer = (images: { url: string; is_primary: boolean }[], initialIndex: number = 0) => {
        setViewerImages(images);
        setViewerInitialIndex(initialIndex);
        setShowImageViewer(true);
    };return (
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
                                {pendingFacilities.map(facility => (                                    <div key={facility.id} className="pending-card">
                                        {facility.images && facility.images.length > 0 && (
                                            <div 
                                                className="card-image" 
                                                onClick={() => openImageViewer(facility.images || [], 0)}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to view full size"
                                            >
                                                <img 
                                                    src={facility.images.find(img => img.is_primary)?.url || facility.images[0].url} 
                                                    alt={facility.name} 
                                                />
                                            </div>
                                        )}                                        <h3>{facility.name}</h3>
                                        <div className="card-details">
                                            {facility.manager_name && (
                                                <p><strong>Created By:</strong> {facility.manager_name}</p>
                                            )}
                                            <p><strong>Sport:</strong> {facility.sport_name}</p>
                                            <p><strong>Category:</strong> {facility.category_name}</p>
                                            <p><strong>City:</strong> {facility.city}</p>
                                            <p><strong>Address:</strong> {facility.address}</p>
                                            <p><strong>Capacity:</strong> {facility.capacity}</p>
                                        </div>
                                        <div className="card-status">
                                            <span className={`status-badge ${facility.is_verified ? (facility.is_active ? "active" : "inactive") : "pending"}`}>
                                                {facility.is_verified ? (facility.is_active ? "Active" : "Inactive") : "Pending Verification"}
                                            </span>
                                        </div>
                                        <div className="card-actions">
                                            <button
                                                className="btn-view-details"
                                                onClick={() => openDetailModal(facility, "facility")}
                                            >
                                                View Details
                                            </button>
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
                            <div className="items-grid">                                {pendingComplexes.map(complex => (
                                    <div key={complex.id} className="pending-card">
                                        {complex.images && complex.images.length > 0 && (
                                            <div 
                                                className="card-image"
                                                onClick={() => openImageViewer(complex.images || [], 0)}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to view full size"
                                            >
                                                <img 
                                                    src={complex.images.find(img => img.is_primary)?.url || complex.images[0].url} 
                                                    alt={complex.name} 
                                                />
                                            </div>
                                        )}
                                        <h3>{complex.name}</h3>
                                        <div className="card-details">
                                            <p><strong>City:</strong> {complex.city}</p>
                                            <p><strong>Address:</strong> {complex.address}</p>
                                        </div>
                                        <div className="card-status">
                                            <span className={`status-badge ${complex.is_verified ? (complex.is_active ? "active" : "inactive") : "pending"}`}>
                                                {complex.is_verified ? (complex.is_active ? "Active" : "Inactive") : "Pending Verification"}
                                            </span>
                                        </div>
                                        <div className="card-actions">
                                            <button
                                                className="btn-view-details"
                                                onClick={() => openDetailModal(complex, "complex")}
                                            >
                                                View Details
                                            </button>
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

            {selectedItem && modalType && (
                <AdminDetailModal
                    item={selectedItem}
                    type={modalType}
                    onClose={() => {
                        setSelectedItem(null);
                        setModalType(null);
                    }}
                    onVerify={() => {
                        if (modalType === "facility") {
                            handleVerifyFacility(selectedItem.id);
                        } else {
                            handleVerifyComplex(selectedItem.id);
                        }
                    }}
                    onToggleStatus={() => {
                        if (modalType === "facility") {
                            handleToggleFacilityStatus(selectedItem.id, selectedItem.is_active);
                        } else {
                            handleToggleComplexStatus(selectedItem.id, selectedItem.is_active);
                        }                    }}
                />
            )}

            {showImageViewer && (
                <ImageViewerModal
                    images={viewerImages}
                    initialIndex={viewerInitialIndex}
                    onClose={() => setShowImageViewer(false)}
                />
            )}
        </div>
    );
}

