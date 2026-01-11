import { useState } from "react";
import type { FacilityDetails, SportComplex } from "../types";
import ImageViewerModal from "./ImageViewerModal";
import "../styles/AdminDetailModal.css";

interface AdminDetailModalProps {
    item: FacilityDetails | SportComplex;
    type: "facility" | "complex";
    onClose: () => void;
    onVerify: () => void;
    onToggleStatus: () => void;
}

export default function AdminDetailModal({ item, type, onClose, onVerify, onToggleStatus }: AdminDetailModalProps) {
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
    
    const isFacility = type === "facility";
    const facility = isFacility ? (item as FacilityDetails) : null;
    const complex = !isFacility ? (item as SportComplex) : null;

    const openImageViewer = (index: number) => {
        setViewerInitialIndex(index);
        setShowImageViewer(true);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{item.name}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">                    {/* Image Gallery */}
                    {item.images && item.images.length > 0 && (
                        <div className="image-gallery">
                            <h3>Images</h3>
                            <div className="image-grid">
                                {item.images.map((image, index) => (
                                    <div 
                                        key={image.id} 
                                        className="image-item"
                                        onClick={() => openImageViewer(index)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click to view full size"
                                    >
                                        <img src={image.url} alt={item.name} />
                                        {image.is_primary && <span className="primary-badge">Primary</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}                    {/* Details Section */}
                    <div className="details-section">
                        <h3>Details</h3>
                        <div className="detail-grid">
                            {/* Manager Info */}
                            {facility?.manager_name && (
                                <>
                                    <div className="detail-item">
                                        <strong>Created By:</strong>
                                        <span>{facility.manager_name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Manager Email:</strong>
                                        <span>{facility.manager_email}</span>
                                    </div>
                                </>
                            )}
                            
                            {isFacility && facility ? (
                                <>
                                    <div className="detail-item">
                                        <strong>Category:</strong>
                                        <span>{facility.category_name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Sport:</strong>
                                        <span>{facility.sport_name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Surface:</strong>
                                        <span>{facility.surface_name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Environment:</strong>
                                        <span>{facility.environment_name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Capacity:</strong>
                                        <span>{facility.capacity}</span>
                                    </div>
                                    {facility.sport_complex_name && (
                                        <div className="detail-item">
                                            <strong>Sport Complex:</strong>
                                            <span>{facility.sport_complex_name}</span>
                                        </div>
                                    )}
                                    <div className="detail-item">
                                        <strong>City:</strong>
                                        <span>{facility.city || "N/A"}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Address:</strong>
                                        <span>{facility.address || "N/A"}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="detail-item">
                                        <strong>City:</strong>
                                        <span>{complex?.city}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Address:</strong>
                                        <span>{complex?.address}</span>
                                    </div>
                                </>
                            )}
                            <div className="detail-item full-width">
                                <strong>Description:</strong>
                                <p>{item.description}</p>
                            </div>
                            <div className="detail-item">
                                <strong>Status:</strong>
                                <span className={`status-badge ${item.is_verified ? (item.is_active ? "active" : "inactive") : "pending"}`}>
                                    {item.is_verified ? (item.is_active ? "Active" : "Inactive") : "Pending Verification"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    {!item.is_verified ? (
                        <button className="btn-verify" onClick={onVerify}>
                            Verify & Activate
                        </button>
                    ) : (
                        <button
                            className={item.is_active ? "btn-deactivate" : "btn-activate"}
                            onClick={onToggleStatus}
                        >
                            {item.is_active ? "Deactivate" : "Activate"}
                        </button>
                    )}                    <button className="btn-cancel" onClick={onClose}>Close</button>
                </div>
            </div>

            {showImageViewer && item.images && (
                <ImageViewerModal
                    images={item.images}
                    initialIndex={viewerInitialIndex}
                    onClose={() => setShowImageViewer(false)}
                />
            )}
        </div>
    );
}
