import { useState, useEffect } from "react";
import { sportComplexService, metadataService } from "../api";
import type { Category, Sport, Surface, Environment } from "../types";
import { ImageUpload } from "./ImageUpload";
import AddFacilitySubWizard from "./AddFacilitySubWizard";
import type { WorkingHours, PricingSlot } from "./WorkingHoursPricing";
import "../styles/CreateWizard.css";

interface CreateSportComplexWizardProps {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
    onCancel?: () => void;
}

interface FacilityData {
    name: string;
    sport_id: number;
    category_id: number;
    surface_id: number;
    environment_id: number;
    description: string;
    capacity: number;
    image_urls?: string[];
    working_hours?: WorkingHours[];
    pricing?: PricingSlot[];
}

export default function CreateSportComplexWizard({
    onSuccess,
    onError,
    onCancel
}: CreateSportComplexWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Metadata
    const [categories, setCategories] = useState<Category[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [surfaces, setSurfaces] = useState<Surface[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [cities, setCities] = useState<string[]>([]);    // Step 1: Basic Information
    const [basicInfo, setBasicInfo] = useState({
        name: "",
        address: "",
        city: "",
        description: ""
    });// Step 2: Facilities
    const [facilities, setFacilities] = useState<FacilityData[]>([]);
    const [showFacilityWizard, setShowFacilityWizard] = useState(false);
    const [editingFacilityIndex, setEditingFacilityIndex] = useState<number | null>(null);

    // Step 3: Images
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    useEffect(() => {        const fetchData = async () => {
            try {
                const [cats, spts, surfs, envs, citiesData] = await Promise.all([
                    metadataService.getCategories(),
                    metadataService.getSports(),
                    metadataService.getSurfaces(),
                    metadataService.getEnvironments(),
                    metadataService.getCities()
                ]);

                setCategories(cats || []);
                setSports(spts || []);
                setSurfaces(surfs || []);
                setEnvironments(envs || []);
                setCities(citiesData || []);
            } catch (err) {
                if (onError) {
                    onError((err as Error).message || "Failed to load metadata");
                }
            }
        };

        fetchData();
    }, [onError]);

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!basicInfo.name.trim()) {
                    if (onError) onError("Complex name is required");
                    return false;
                }
                if (!basicInfo.city.trim()) {
                    if (onError) onError("City is required");
                    return false;
                }
                if (!basicInfo.address.trim()) {
                    if (onError) onError("Address is required");
                    return false;
                }
                if (!basicInfo.description.trim()) {
                    if (onError) onError("Description is required");
                    return false;
                }
                return true;

            case 2:
                if (facilities.length === 0) {
                    if (onError) onError("Please add at least one facility");
                    return false;
                }
                for (const facility of facilities) {
                    if (!facility.name.trim()) {
                        if (onError) onError("All facilities must have a name");
                        return false;
                    }
                    if (!facility.sport_id || !facility.category_id || !facility.surface_id || !facility.environment_id) {
                        if (onError) onError("All facility fields are required");
                        return false;
                    }
                    if (facility.capacity <= 0) {
                        if (onError) onError("Capacity must be greater than 0");
                        return false;
                    }
                }
                return true;

            case 3:
                if (imageUrls.length === 0) {
                    if (onError) onError("Please upload at least one image");
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(currentStep + 1);
            if (onError) onError(""); // Clear errors
        }
    };

    const prevStep = () => {
        setCurrentStep(currentStep - 1);
        if (onError) onError(""); // Clear errors
    };    const addFacility = () => {
        setEditingFacilityIndex(null);
        setShowFacilityWizard(true);
    };

    const removeFacility = (index: number) => {
        setFacilities(facilities.filter((_, i) => i !== index));
    };

    const handleFacilitySave = (facilityData: FacilityData) => {
        if (editingFacilityIndex !== null) {
            // Update existing facility
            const updated = [...facilities];
            updated[editingFacilityIndex] = facilityData;
            setFacilities(updated);
        } else {
            // Add new facility
            setFacilities([...facilities, facilityData]);
        }
        setShowFacilityWizard(false);
        setEditingFacilityIndex(null);
    };

    const handleEditFacility = (index: number) => {
        setEditingFacilityIndex(index);
        setShowFacilityWizard(true);
    };

    const handleCancelFacilityWizard = () => {
        setShowFacilityWizard(false);
        setEditingFacilityIndex(null);
    };    const handleSubmit = async () => {
        if (!validateStep(4)) return;        setLoading(true);
        try {
            await sportComplexService.create({
                name: basicInfo.name,
                address: basicInfo.address,
                city: basicInfo.city,
                description: basicInfo.description,
                image_urls: imageUrls,
                facilities: facilities.map(f => ({
                    name: f.name,
                    category_id: f.category_id,
                    surface_id: f.surface_id,
                    environment_id: f.environment_id,
                    description: f.description,
                    capacity: f.capacity,
                    image_urls: []
                }))
            });

            if (onSuccess) {
                onSuccess("Sport complex created successfully! Waiting for admin approval.");
            }
        } catch (err) {
            if (onError) {
                onError((err as Error).message || "Failed to create sport complex");
            }
        } finally {
            setLoading(false);
        }
    };

    const renderProgressBar = () => (
        <div className="wizard-progress">
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Basic Info</div>
            </div>
            <div className={`step-line ${currentStep > 1 ? 'completed' : ''}`} />
            <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Facilities</div>
            </div>
            <div className={`step-line ${currentStep > 2 ? 'completed' : ''}`} />
            <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Images</div>
            </div>
            <div className={`step-line ${currentStep > 3 ? 'completed' : ''}`} />
            <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                <div className="step-number">4</div>
                <div className="step-label">Review</div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="wizard-step">
            <h3>Step 1: Basic Information</h3>
            <p className="step-description">Enter the basic details about your sport complex</p>

            <div className="form-group">
                <label>Complex Name *</label>
                <input
                    type="text"
                    placeholder="e.g., Central Sports Arena"
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                />
            </div>

            <div className="form-group">
                <label>City *</label>
                <select
                    value={basicInfo.city}
                    onChange={(e) => setBasicInfo({ ...basicInfo, city: e.target.value })}
                >
                    <option value="">Select City</option>
                    {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Address *</label>
                <input
                    type="text"
                    placeholder="e.g., 123 Main Street"
                    value={basicInfo.address}
                    onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                />
            </div>            <div className="form-group">
                <label>Description *</label>
                <textarea
                    placeholder="Describe your sport complex, its features, and amenities..."
                    value={basicInfo.description}
                    onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                    rows={5}
                />
            </div>
        </div>
    );const renderStep2 = () => (
        <div className="wizard-step">
            <h3>Step 2: Add Facilities</h3>
            <p className="step-description">Add the facilities that belong to this sport complex</p>

            <button type="button" className="btn-add-facility" onClick={addFacility}>
                + Add Facility
            </button>

            {facilities.length === 0 ? (
                <p className="empty-message">No facilities added yet. Click the button above to add one.</p>
            ) : (
                <div className="facilities-list">
                    {facilities.map((facility, index) => (
                        <div key={index} className="facility-card-wizard">
                            <div className="facility-header">
                                <h4>Facility {index + 1}: {facility.name}</h4>
                                <div className="facility-actions">
                                    <button
                                        type="button"
                                        className="btn-edit-small"
                                        onClick={() => handleEditFacility(index)}
                                        title="Edit facility"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-remove"
                                        onClick={() => removeFacility(index)}
                                        title="Remove facility"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className="facility-summary-view">
                                <div className="summary-row">
                                    <strong>Sport:</strong> {sports.find(s => s.id === facility.sport_id)?.name}
                                </div>
                                <div className="summary-row">
                                    <strong>Category:</strong> {categories.find(c => c.id === facility.category_id)?.name}
                                </div>
                                <div className="summary-row">
                                    <strong>Surface:</strong> {surfaces.find(s => s.id === facility.surface_id)?.name}
                                </div>
                                <div className="summary-row">
                                    <strong>Environment:</strong> {environments.find(e => e.id === facility.environment_id)?.name}
                                </div>
                                <div className="summary-row">
                                    <strong>Capacity:</strong> {facility.capacity} players
                                </div>
                                <div className="summary-row description">
                                    <strong>Description:</strong>
                                    <p>{facility.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showFacilityWizard && (
                <AddFacilitySubWizard
                    sports={sports}
                    categories={categories}
                    surfaces={surfaces}
                    environments={environments}
                    onSave={handleFacilitySave}
                    onCancel={handleCancelFacilityWizard}
                    initialData={editingFacilityIndex !== null ? facilities[editingFacilityIndex] : undefined}
                />
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="wizard-step">
            <h3>Step 3: Upload Images</h3>
            <p className="step-description">Add photos of your sport complex (at least 1 required, up to 5)</p>

            <ImageUpload 
                onImagesUploaded={setImageUrls} 
                maxImages={5}
                folder="sport-complexes"
                title="Sport Complex Images"
            />

            {imageUrls.length > 0 && (
                <div className="upload-success">
                    ✓ {imageUrls.length} image(s) uploaded successfully
                </div>
            )}
        </div>
    );

    const renderStep4 = () => (
        <div className="wizard-step">
            <h3>Step 4: Review & Submit</h3>
            <p className="step-description">Review all information before submitting</p>

            <div className="review-section">
                <div className="review-card">
                    <h4>Basic Information</h4>
                    <div className="review-item">
                        <span className="review-label">Name:</span>
                        <span className="review-value">{basicInfo.name}</span>
                    </div>
                    <div className="review-item">
                        <span className="review-label">City:</span>
                        <span className="review-value">{basicInfo.city}</span>
                    </div>                    <div className="review-item">
                        <span className="review-label">Address:</span>
                        <span className="review-value">{basicInfo.address}</span>
                    </div>
                    <div className="review-item">
                        <span className="review-label">Description:</span>
                        <span className="review-value">{basicInfo.description}</span>
                    </div>
                    <button className="btn-edit" onClick={() => setCurrentStep(1)}>Edit</button>
                </div>

                <div className="review-card">
                    <h4>Facilities ({facilities.length})</h4>
                    {facilities.map((facility, index) => (
                        <div key={index} className="facility-review">
                            <strong>{facility.name}</strong>
                            <div className="review-facility-details">
                                <span>{sports.find(s => s.id === facility.sport_id)?.name}</span>
                                <span>•</span>
                                <span>{categories.find(c => c.id === facility.category_id)?.name}</span>
                                <span>•</span>
                                <span>Capacity: {facility.capacity}</span>
                            </div>
                        </div>
                    ))}
                    <button className="btn-edit" onClick={() => setCurrentStep(2)}>Edit</button>
                </div>

                <div className="review-card">
                    <h4>Images ({imageUrls.length})</h4>
                    <div className="review-images">
                        {imageUrls.map((url, index) => (
                            <img key={index} src={url} alt={`Preview ${index + 1}`} className="review-image-thumb" />
                        ))}
                    </div>
                    <button className="btn-edit" onClick={() => setCurrentStep(3)}>Edit</button>
                </div>
            </div>

            <div className="submission-note">
                <strong>Note:</strong> Your sport complex will be submitted for admin approval. 
                You will be notified once it's approved and active.
            </div>
        </div>
    );

    return (
        <div className="create-wizard">
            {renderProgressBar()}

            <div className="wizard-content">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
            </div>

            <div className="wizard-actions">
                {onCancel && (
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                )}
                
                {currentStep > 1 && (
                    <button type="button" className="btn-secondary" onClick={prevStep}>
                        ← Previous
                    </button>
                )}
                
                {currentStep < 4 ? (
                    <button type="button" className="btn-primary" onClick={nextStep}>
                        Next →
                    </button>
                ) : (
                    <button 
                        type="button" 
                        className="btn-primary btn-submit" 
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Submitting..." : "Submit for Approval"}
                    </button>
                )}
            </div>
        </div>
    );
}
