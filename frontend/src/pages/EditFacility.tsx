import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFacilityById, updateFacility, getCategories, getSurfaces, getEnvironments, getCities } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Category, Surface, Environment } from "../types";
import "../styles/EditFacility.css";

export default function EditFacility() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        sport_complex_id: null as number | null,
        category_id: 0,
        surface_id: 0,
        environment_id: 0,
        description: "",
        capacity: 0,
        city: "",
        address: ""
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [surfaces, setSurfaces] = useState<Surface[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !user) return;

            try {
                setLoading(true);
                const [facilityData, categoriesData, surfacesData, environmentsData, citiesData] = await Promise.all([
                    getFacilityById(parseInt(id)),
                    getCategories(),
                    getSurfaces(),
                    getEnvironments(),
                    getCities()
                ]);

                // Check if user is the owner
                if (facilityData.manager_id !== user.id) {
                    setError("You are not authorized to edit this facility");
                    setIsOwner(false);
                    return;
                }

                setIsOwner(true);
                setFormData({
                    name: facilityData.name,
                    sport_complex_id: facilityData.sport_complex_id || null,
                    category_id: facilityData.category_id,
                    surface_id: facilityData.surface_id,
                    environment_id: facilityData.environment_id,
                    description: facilityData.description,
                    capacity: facilityData.capacity,
                    city: facilityData.city || "",
                    address: facilityData.address || ""
                });

                setCategories(categoriesData);
                setSurfaces(surfacesData);
                setEnvironments(environmentsData);
                setCities(citiesData);
                setError("");
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load facility details";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!id) return;

        // Validation
        if (!formData.name.trim()) {
            setError("Facility name is required");
            return;
        }
        if (!formData.category_id) {
            setError("Category is required");
            return;
        }
        if (!formData.surface_id) {
            setError("Surface is required");
            return;
        }
        if (!formData.environment_id) {
            setError("Environment is required");
            return;
        }
        if (!formData.city.trim()) {
            setError("City is required");
            return;
        }
        if (!formData.address.trim()) {
            setError("Address is required");
            return;
        }
        if (formData.capacity <= 0) {
            setError("Capacity must be greater than 0");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            
            await updateFacility(parseInt(id), formData);
            
            // Redirect to facility details page
            navigate(`/facilities/${id}`);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update facility";
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'capacity' || name === 'category_id' || name === 'surface_id' || name === 'environment_id'
                ? parseInt(value) || 0
                : value
        }));
    };

    if (loading) {
        return (
            <div className="edit-facility-container">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="edit-facility-container">
                <div className="error-message">
                    {error || "You are not authorized to edit this facility"}
                </div>
                <button onClick={() => navigate(-1)} className="back-btn">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="edit-facility-container">
            <div className="edit-facility-header">
                <h1>Edit Facility</h1>
                <button onClick={() => navigate(-1)} className="back-btn">
                    ← Back
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="edit-facility-form">
                <div className="form-section">
                    <h2>Basic Information</h2>
                    
                    <div className="form-group">
                        <label htmlFor="name">Facility Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            required
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h2>Location</h2>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="city">City *</label>
                            <select
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a city</option>
                                {cities.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="address">Address *</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Facility Details</h2>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="category_id">Category *</label>
                            <select
                                id="category_id"
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                required
                            >
                                <option value={0}>Select a category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="surface_id">Surface Type *</label>
                            <select
                                id="surface_id"
                                name="surface_id"
                                value={formData.surface_id}
                                onChange={handleChange}
                                required
                            >
                                <option value={0}>Select a surface</option>
                                {surfaces.map((surface) => (
                                    <option key={surface.id} value={surface.id}>
                                        {surface.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="environment_id">Environment *</label>
                            <select
                                id="environment_id"
                                name="environment_id"
                                value={formData.environment_id}
                                onChange={handleChange}
                                required
                            >
                                <option value={0}>Select an environment</option>
                                {environments.map((environment) => (
                                    <option key={environment.id} value={environment.id}>
                                        {environment.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="capacity">Capacity *</label>
                            <input
                                type="number"
                                id="capacity"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button 
                        type="button" 
                        onClick={() => navigate(-1)} 
                        className="cancel-btn"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={submitting}
                    >
                        {submitting ? "Updating..." : "Update Facility"}
                    </button>
                </div>
            </form>
        </div>
    );
}
