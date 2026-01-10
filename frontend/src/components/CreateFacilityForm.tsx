import { useState, useEffect } from "react";
import { createFacility, getCategories, getSports, getSurfaces, getEnvironments, getMySportComplexes } from "../services/api";
import type { Category, Sport, Surface, Environment, SportComplex } from "../types";

interface CreateFacilityFormProps {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
    onCancel?: () => void;
    submitButtonText?: string;
}

export default function CreateFacilityForm({
    onSuccess,
    onError,
    submitButtonText = "Submit for Approval"
}: CreateFacilityFormProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [surfaces, setSurfaces] = useState<Surface[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [mySportComplexes, setMySportComplexes] = useState<SportComplex[]>([]);

    const [facilityForm, setFacilityForm] = useState({
        name: "",
        sport_complex_id: null as number | null,
        sport_id: 0,
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
                const [cats, spts, surfs, envs, complexes] = await Promise.all([
                    getCategories(),
                    getSports(),
                    getSurfaces(),
                    getEnvironments(),
                    getMySportComplexes()
                ]);

                if (isMounted) {
                    setCategories(cats || []);
                    setSports(spts || []);
                    setSurfaces(surfs || []);
                    setEnvironments(envs || []);
                    setMySportComplexes(complexes || []);
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
    }, [onError]);

    const getFilteredCategories = (sportId: number) => {
        if (!sportId) return [];
        return categories.filter(cat => cat.sport_id === sportId);
    };

    const handleSportChange = (sportId: number) => {
        const filteredCategories = getFilteredCategories(sportId);
        setFacilityForm({
            ...facilityForm,
            sport_id: sportId,
            category_id: filteredCategories[0]?.id || 0
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createFacility({
                name: facilityForm.name,
                sport_complex_id: facilityForm.sport_complex_id,
                category_id: facilityForm.category_id,
                surface_id: facilityForm.surface_id,
                environment_id: facilityForm.environment_id,
                description: facilityForm.description,
                capacity: facilityForm.capacity
            });

            if (onSuccess) {
                onSuccess("Facility created successfully! Waiting for admin approval.");
            }

            // Reset form
            setFacilityForm({
                name: "",
                sport_complex_id: null,
                sport_id: 0,
                category_id: 0,
                surface_id: 0,
                environment_id: 0,
                description: "",
                capacity: 0
            });
        } catch (err) {
            if (onError) {
                onError((err as Error).message || "Failed to create facility");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="create-form">
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
                value={facilityForm.sport_id}
                onChange={(e) => handleSportChange(parseInt(e.target.value))}
                required
            >
                <option value={0}>Select Sport</option>
                {sports.map(sport => (
                    <option key={sport.id} value={sport.id}>{sport.name}</option>
                ))}
            </select>

            <select
                value={facilityForm.category_id}
                onChange={(e) => setFacilityForm({ ...facilityForm, category_id: parseInt(e.target.value) })}
                required
                disabled={!facilityForm.sport_id}
            >
                <option value={0}>Select Category</option>
                {getFilteredCategories(facilityForm.sport_id).map(cat => (
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
                {loading ? "Creating..." : submitButtonText}
            </button>
        </form>
    );
}
