import { useState, useEffect } from "react";
import { createSportComplex, getCategories, getSports, getSurfaces, getEnvironments } from "../services/api";
import type { Category, Sport, Surface, Environment } from "../types";
import { ImageUpload } from "./ImageUpload";

interface CreateSportComplexFormProps {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
    onCancel?: () => void;
    submitButtonText?: string;
}

export default function CreateSportComplexForm({
    onSuccess,
    onError,
    submitButtonText = "Submit for Approval"
}: CreateSportComplexFormProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [surfaces, setSurfaces] = useState<Surface[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);    const [complexForm, setComplexForm] = useState({
        name: "",
        address: "",
        city: "",
        description: "",
        facilities: [] as Array<{
            name: string;
            sport_id: number;
            category_id: number;
            surface_id: number;
            environment_id: number;
            description: string;
            capacity: number;
            image_urls: string[];
            isExpanded: boolean;
        }>
    });

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const [cats, spts, surfs, envs] = await Promise.all([
                    getCategories(),
                    getSports(),
                    getSurfaces(),
                    getEnvironments()
                ]);

                if (isMounted) {
                    setCategories(cats || []);
                    setSports(spts || []);
                    setSurfaces(surfs || []);
                    setEnvironments(envs || []);
                }
            } catch (err) {
                if (isMounted && onError) {
                    onError((err as Error).message || "Failed to load metadata");
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [onError]);    const addFacilityToComplex = () => {
        setComplexForm({
            ...complexForm,
            facilities: [
                ...complexForm.facilities,
                {
                    name: "",
                    sport_id: sports[0]?.id || 0,
                    category_id: categories[0]?.id || 0,
                    surface_id: surfaces[0]?.id || 0,
                    environment_id: environments[0]?.id || 0,
                    description: "",
                    capacity: 0,
                    image_urls: [],
                    isExpanded: true
                }
            ]
        });
    };

    const removeFacilityFromComplex = (index: number) => {
        setComplexForm({
            ...complexForm,
            facilities: complexForm.facilities.filter((_, i) => i !== index)
        });
    };    const updateFacilityInComplex = (index: number, field: string, value: string | number | string[]) => {
        const updatedFacilities = [...complexForm.facilities];
        updatedFacilities[index] = { ...updatedFacilities[index], [field]: value };

        // If sport changes, reset category
        if (field === 'sport_id') {
            const filteredCategories = categories.filter(cat => cat.sport_id === Number(value));
            updatedFacilities[index].category_id = filteredCategories[0]?.id || 0;
        }
        
        setComplexForm({ ...complexForm, facilities: updatedFacilities });
    };

    const toggleFacilityExpanded = (index: number) => {
        const updatedFacilities = [...complexForm.facilities];
        updatedFacilities[index].isExpanded = !updatedFacilities[index].isExpanded;
        setComplexForm({ ...complexForm, facilities: updatedFacilities });
    };

    const getFilteredCategories = (sportId: number) => {
        if (!sportId) return [];
        return categories.filter(cat => cat.sport_id === sportId);
    };    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (complexForm.facilities.length === 0) {
                if (onError) {
                    onError("Please add at least one facility to the sport complex");
                }
                setLoading(false);
                return;
            }

            if (imageUrls.length === 0) {
                if (onError) {
                    onError("Please upload at least one image for the sport complex");
                }
                setLoading(false);
                return;
            }

            // Validate that each facility has at least one image
            const facilitiesWithoutImages = complexForm.facilities.filter(f => !f.image_urls || f.image_urls.length === 0);
            if (facilitiesWithoutImages.length > 0) {
                if (onError) {
                    onError("Each facility must have at least one image");
                }
                setLoading(false);
                return;
            }

            await createSportComplex({
                name: complexForm.name,
                address: complexForm.address,
                city: complexForm.city,
                description: complexForm.description,
                image_urls: imageUrls,
                facilities: complexForm.facilities.map(f => ({
                    name: f.name,
                    category_id: f.category_id,
                    surface_id: f.surface_id,
                    environment_id: f.environment_id,
                    description: f.description,
                    capacity: f.capacity,
                    image_urls: f.image_urls
                }))
            });

            if (onSuccess) {
                onSuccess("Sport complex created successfully! Waiting for admin approval.");
            }

            // Reset form
            setComplexForm({
                name: "",
                address: "",
                city: "",
                description: "",
                facilities: []
            });
            setImageUrls([]);
        } catch (err) {
            if (onError) {
                onError((err as Error).message || "Failed to create sport complex");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="create-form">
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
            />            <textarea
                placeholder="Description"
                value={complexForm.description}
                onChange={(e) => setComplexForm({ ...complexForm, description: e.target.value })}
                required
            />

            <ImageUpload 
                onImagesUploaded={setImageUrls} 
                maxImages={5}
                folder="sport-complexes"
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
                )}                <div className="facilities-horizontal-list">
                    {complexForm.facilities.map((facility, index) => (
                        <div key={index} className={`facility-form-card ${!facility.isExpanded ? 'collapsed' : ''}`}>
                            <div className="facility-header">
                                <h4 onClick={() => toggleFacilityExpanded(index)} style={{ cursor: 'pointer', flex: 1 }}>
                                    <span className="collapse-icon">{facility.isExpanded ? '▼' : '▶'}</span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        Facility {index + 1}{facility.name && `: ${facility.name}`}
                                    </span>
                                    {facility.image_urls.length > 0 && (
                                        <span className="image-count">({facility.image_urls.length})</span>
                                    )}
                                </h4>
                                <button
                                    type="button"
                                    className="remove-facility-btn"
                                    onClick={() => removeFacilityFromComplex(index)}
                                    title="Remove facility"
                                >
                                    ×
                                </button>
                            </div>

                            {facility.isExpanded && (
                                <div className="facility-content">
                                    <input
                                        type="text"
                                        placeholder="Facility Name"
                                        value={facility.name}
                                        onChange={(e) => updateFacilityInComplex(index, "name", e.target.value)}
                                        required
                                    />

                                    <select
                                        value={facility.sport_id}
                                        onChange={(e) => updateFacilityInComplex(index, "sport_id", parseInt(e.target.value))}
                                        required
                                    >
                                        <option value={0}>Select Sport</option>
                                        {sports.map(sport => (
                                            <option key={sport.id} value={sport.id}>{sport.name}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={facility.category_id}
                                        onChange={(e) => updateFacilityInComplex(index, "category_id", parseInt(e.target.value))}
                                        required
                                        disabled={!facility.sport_id}
                                    >
                                        <option value={0}>Select Category</option>
                                        {getFilteredCategories(facility.sport_id).map(cat => (
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

                                    <div className="facility-image-upload">
                                        <label className="image-upload-label">Facility Images *</label>
                                        <ImageUpload
                                            onImagesUploaded={(urls) => updateFacilityInComplex(index, "image_urls", urls)}
                                            maxImages={5}
                                            folder={`facilities/facility-${index}`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Creating..." : submitButtonText}
            </button>
        </form>
    );
}
