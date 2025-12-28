import { useState, useEffect } from "react";
import {
    createSportComplex,
    createFacility,
    getCategories,
    getSurfaces,
    getEnvironments,
    getMySportComplexes,
    authenticatedFetch
} from "../services/api";
import type { Category, Surface, Environment, SportComplex, FacilityDetails } from "../types";
import "../styles/ManageFacilities.css";

export default function ManageFacilities() {
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
                    setCategories(cats);
                    setSurfaces(surfs);
                    setEnvironments(envs);
                    setMySportComplexes(complexes);
                }
            } catch (err) {
                if (isMounted) {
                    setError((err as Error).message || "Failed to load metadata");
                }
            }
        };

        const fetchFacilities = async () => {
            try {
                const response = await authenticatedFetch("/facilities/my", { method: "GET" });
                if (!response.ok) {
                    throw new Error("Failed to fetch facilities");
                }
                const data = await response.json();
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
            const [complexes, response] = await Promise.all([
                getMySportComplexes(),
                authenticatedFetch("/facilities/my", { method: "GET" })
            ]);

            setMySportComplexes(complexes);

            if (response.ok) {
                const data = await response.json();
                setMyFacilities(data || []);
            }
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

            setSuccess("Sport complex created successfully! Waiting for admin approval.");
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
            setSuccess("Facility created successfully! Waiting for admin approval.");
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
                    onClick={() => setShowCreateForm(true)}
                >
                    + Create New
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* List of my facilities */}
            <div className="facilities-list">
                <h2>My Sport Complexes</h2>
                {mySportComplexes.length === 0 ? (
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
                {myFacilities.filter(f => !f.sport_complex_id).length === 0 ? (
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
                <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowCreateForm(false)}>×</button>

                        <h2>Create New</h2>

                        <div className="create-type-selector">
                            <button
                                className={createType === "complex" ? "active" : ""}
                                onClick={() => setCreateType("complex")}
                            >
                                Sport Complex
                            </button>
                            <button
                                className={createType === "facility" ? "active" : ""}
                                onClick={() => setCreateType("facility")}
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
                                    placeholder="Address"
                                    value={complexForm.address}
                                    onChange={(e) => setComplexForm({ ...complexForm, address: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={complexForm.city}
                                    onChange={(e) => setComplexForm({ ...complexForm, city: e.target.value })}
                                    required
                                />
                                <textarea
                                    placeholder="Description"
                                    value={complexForm.description}
                                    onChange={(e) => setComplexForm({ ...complexForm, description: e.target.value })}
                                    required
                                />

                                <div className="facilities-section">
                                    <div className="section-header">
                                        <h3>Facilities</h3>
                                        <button
                                            type="button"
                                            className="btn-add-facility"
                                            onClick={addFacilityToComplex}
                                        >
                                            + Add Facility
                                        </button>
                                    </div>

                                    {complexForm.facilities.length === 0 && (
                                        <p className="empty-message">Click "+ Add Facility" to add facilities to this complex</p>
                                    )}

                                    <div className="facilities-horizontal-list">
                                        {complexForm.facilities.map((facility, index) => (
                                            <div key={index} className="facility-form-card">
                                                <button
                                                    type="button"
                                                    className="remove-facility-btn"
                                                    onClick={() => removeFacilityFromComplex(index)}
                                                >
                                                    ×
                                                </button>

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
                                                    <option value={0}>Select Category</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>

                                                <select
                                                    value={facility.surface_id}
                                                    onChange={(e) => updateFacilityInComplex(index, "surface_id", parseInt(e.target.value))}
                                                    required
                                                >
                                                    <option value={0}>Select Surface</option>
                                                    {surfaces.map(surf => (
                                                        <option key={surf.id} value={surf.id}>{surf.name}</option>
                                                    ))}
                                                </select>

                                                <select
                                                    value={facility.environment_id}
                                                    onChange={(e) => updateFacilityInComplex(index, "environment_id", parseInt(e.target.value))}
                                                    required
                                                >
                                                    <option value={0}>Select Environment</option>
                                                    {environments.map(env => (
                                                        <option key={env.id} value={env.id}>{env.name}</option>
                                                    ))}
                                                </select>

                                                <textarea
                                                    placeholder="Description"
                                                    value={facility.description}
                                                    onChange={(e) => updateFacilityInComplex(index, "description", e.target.value)}
                                                    required
                                                />

                                                <input
                                                    type="number"
                                                    placeholder="Capacity"
                                                    value={facility.capacity || ""}
                                                    onChange={(e) => updateFacilityInComplex(index, "capacity", parseInt(e.target.value))}
                                                    required
                                                    min="1"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

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
                                    value={facilityForm.sport_complex_id || ""}
                                    onChange={(e) => setFacilityForm({
                                        ...facilityForm,
                                        sport_complex_id: e.target.value ? parseInt(e.target.value) : null
                                    })}
                                >
                                    <option value="">Standalone (No Complex)</option>
                                    {mySportComplexes.filter(c => c.is_verified).map(complex => (
                                        <option key={complex.id} value={complex.id}>{complex.name}</option>
                                    ))}
                                </select>

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

                                <textarea
                                    placeholder="Description"
                                    value={facilityForm.description}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })}
                                    required
                                />

                                <input
                                    type="number"
                                    placeholder="Capacity"
                                    value={facilityForm.capacity || ""}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, capacity: parseInt(e.target.value) })}
                                    required
                                    min="1"
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

