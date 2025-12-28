import { useState, useEffect } from "react";
import {
    createSportComplex,
    createFacility,
    getCategories,
    getSurfaces,
    getEnvironments,
    getMySportComplexes,
    getMyFacilities
} from "../services/api";
import type { Category, Surface, Environment, SportComplex, FacilityDetails } from "../types";
import "../styles/BecomeManager.css";

export default function BecomeManager() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createType, setCreateType] = useState<"complex" | "facility">("complex");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Metadata
    const [categories, setCategories] = useState<Category[]>([]);
    const [surfaces, setSurfaces] = useState<Surface[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [mySportComplexes, setMySportComplexes] = useState<SportComplex[]>([]);
    const [myFacilities, setMyFacilities] = useState<FacilityDetails[]>([]);

    // Sport Complex form
    const [complexForm, setComplexForm] = useState({
        name: "",
        address: "",
        city: "",
        description: "",
        facilities: [] as Array<{
            name: string;
            category_id: number;
            surface_id: number;
            environment_id: number;
            description: string;
            capacity: number;
        }>
    });

    // Standalone Facility form
    const [facilityForm, setFacilityForm] = useState({
        name: "",
        sport_complex_id: null as number | null,
        category_id: 0,
        surface_id: 0,
        environment_id: 0,
        description: "",
        capacity: 0
    });

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const [cats, surfs, envs, complexes] = await Promise.all([
                    getCategories(),
                    getSurfaces(),
                    getEnvironments(),
                    getMySportComplexes()
                ]);

                if (isMounted) {
                    setCategories(cats || []);
                    setSurfaces(surfs || []);
                    setEnvironments(envs || []);
                    setMySportComplexes(complexes || []);
                }
            } catch (err) {
                if (isMounted) {
                    setError((err as Error).message || "Failed to load metadata");
                }
            }
        };

        const fetchFacilities = async () => {
            try {
                const data = await getMyFacilities();
                if (isMounted) {
                    setMyFacilities(data || []);
                }
            } catch (err) {
                console.error("Failed to fetch facilities:", err);
            }
        };

        fetchData();
        fetchFacilities();

        return () => {
            isMounted = false;
        };
    }, []);

    const refreshData = async () => {
        try {
            const [complexes, facilities] = await Promise.all([
                getMySportComplexes(),
                getMyFacilities()
            ]);

            setMySportComplexes(complexes || []);
            setMyFacilities(facilities || []);
        } catch (err) {
            console.error("Failed to refresh data:", err);
        }
    };

    const addFacilityToComplex = () => {
        setComplexForm({
            ...complexForm,
            facilities: [
                ...complexForm.facilities,
                {
                    name: "",
                    category_id: categories[0]?.id || 0,
                    surface_id: surfaces[0]?.id || 0,
                    environment_id: environments[0]?.id || 0,
                    description: "",
                    capacity: 0
                }
            ]
        });
    };

    const removeFacilityFromComplex = (index: number) => {
        setComplexForm({
            ...complexForm,
            facilities: complexForm.facilities.filter((_, i) => i !== index)
        });
    };

    const updateFacilityInComplex = (index: number, field: string, value: string | number) => {
        const updatedFacilities = [...complexForm.facilities];
        updatedFacilities[index] = { ...updatedFacilities[index], [field]: value };
        setComplexForm({ ...complexForm, facilities: updatedFacilities });
    };

    const handleCreateSportComplex = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            if (complexForm.facilities.length === 0) {
                setError("Please add at least one facility to the sport complex");
                return;
            }

            await createSportComplex({
                name: complexForm.name,
                address: complexForm.address,
                city: complexForm.city,
                description: complexForm.description,
                facilities: complexForm.facilities
            });

            setSuccess("Sport complex created successfully! Waiting for admin approval. Once approved, you'll be upgraded to a Manager!");
            setComplexForm({
                name: "",
                address: "",
                city: "",
                description: "",
                facilities: []
            });
            setShowCreateForm(false);
            refreshData();
        } catch (err) {
            setError((err as Error).message || "Failed to create sport complex");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFacility = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await createFacility(facilityForm);
            setSuccess("Facility created successfully! Waiting for admin approval. Once approved, you'll be upgraded to a Manager!");
            setFacilityForm({
                name: "",
                sport_complex_id: null,
                category_id: 0,
                surface_id: 0,
                environment_id: 0,
                description: "",
                capacity: 0
            });
            setShowCreateForm(false);
            refreshData();
        } catch (err) {
            setError((err as Error).message || "Failed to create facility");
        } finally {
            setLoading(false);
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
                    you'll be upgraded to a Manager account with full access to facility management tools.
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
            </div>

            <div className="action-section">
                <h2>Get Started</h2>
                <p>Submit your sport complex or facility for review. Our team will verify it within 24-48 hours.</p>
                <button
                    className="btn-primary btn-large"
                    onClick={openCreateModal}
                >
                    + Add Your First Facility
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Pending/Waiting List */}
            {hasPendingItems() && (
                <div className="waiting-list-section">
                    <h2>Your Waiting List</h2>
                    <p className="section-description">
                        These items are waiting for admin approval. You'll be notified once they're verified!
                    </p>

                    {mySportComplexes.filter(c => !c.is_verified).length > 0 && (
                        <>
                            <h3>Pending Sport Complexes</h3>
                            <div className="complexes-grid">
                                {mySportComplexes.filter(c => !c.is_verified).map(complex => (
                                    <div key={complex.id} className="complex-card pending-item">
                                        <h4>{complex.name}</h4>
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
                                    <div key={facility.id} className="facility-card pending-item">
                                        <h4>{facility.name}</h4>
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

            {/* Create Form Modal */}
            {showCreateForm && (
                <div className="modal-overlay" onClick={closeCreateModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeCreateModal}>×</button>

                        <h2>Add Your Facility</h2>

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
                            <form onSubmit={handleCreateSportComplex} className="create-form">
                                <h3>Sport Complex Information</h3>
                                <input
                                    type="text"
                                    placeholder="Complex Name"
                                    value={complexForm.name}
                                    onChange={(e) => setComplexForm({ ...complexForm, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={complexForm.city}
                                    onChange={(e) => setComplexForm({ ...complexForm, city: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Address"
                                    value={complexForm.address}
                                    onChange={(e) => setComplexForm({ ...complexForm, address: e.target.value })}
                                    required
                                />
                                <textarea
                                    placeholder="Description"
                                    value={complexForm.description}
                                    onChange={(e) => setComplexForm({ ...complexForm, description: e.target.value })}
                                    required
                                />

                                <h3>Facilities</h3>
                                {complexForm.facilities.map((facility, index) => (
                                    <div key={index} className="facility-form-item">
                                        <h4>Facility {index + 1}</h4>
                                        <input
                                            type="text"
                                            placeholder="Facility Name"
                                            value={facility.name}
                                            onChange={(e) => updateFacilityInComplex(index, "name", e.target.value)}
                                            required
                                        />
                                        <select
                                            value={facility.category_id}
                                            onChange={(e) => updateFacilityInComplex(index, "category_id", parseInt(e.target.value))}
                                            required
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={facility.surface_id}
                                            onChange={(e) => updateFacilityInComplex(index, "surface_id", parseInt(e.target.value))}
                                            required
                                        >
                                            {surfaces.map(surf => (
                                                <option key={surf.id} value={surf.id}>{surf.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={facility.environment_id}
                                            onChange={(e) => updateFacilityInComplex(index, "environment_id", parseInt(e.target.value))}
                                            required
                                        >
                                            {environments.map(env => (
                                                <option key={env.id} value={env.id}>{env.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="Capacity"
                                            value={facility.capacity}
                                            onChange={(e) => updateFacilityInComplex(index, "capacity", parseInt(e.target.value))}
                                            required
                                        />
                                        <textarea
                                            placeholder="Facility Description"
                                            value={facility.description}
                                            onChange={(e) => updateFacilityInComplex(index, "description", e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn-remove"
                                            onClick={() => removeFacilityFromComplex(index)}
                                        >
                                            Remove Facility
                                        </button>
                                    </div>
                                ))}

                                <button type="button" className="btn-secondary" onClick={addFacilityToComplex}>
                                    + Add Facility
                                </button>

                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? "Creating..." : "Submit for Approval"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateFacility} className="create-form">
                                <h3>Facility Information</h3>
                                <input
                                    type="text"
                                    placeholder="Facility Name"
                                    value={facilityForm.name}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                                    required
                                />
                                <select
                                    value={facilityForm.category_id}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, category_id: parseInt(e.target.value) })}
                                    required
                                >
                                    <option value={0}>Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={facilityForm.surface_id}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, surface_id: parseInt(e.target.value) })}
                                    required
                                >
                                    <option value={0}>Select Surface</option>
                                    {surfaces.map(surf => (
                                        <option key={surf.id} value={surf.id}>{surf.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={facilityForm.environment_id}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, environment_id: parseInt(e.target.value) })}
                                    required
                                >
                                    <option value={0}>Select Environment</option>
                                    {environments.map(env => (
                                        <option key={env.id} value={env.id}>{env.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    placeholder="Capacity"
                                    value={facilityForm.capacity}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, capacity: parseInt(e.target.value) })}
                                    required
                                />
                                <textarea
                                    placeholder="Description"
                                    value={facilityForm.description}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })}
                                    required
                                />

                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? "Creating..." : "Submit for Approval"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

