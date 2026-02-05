import { useState, useEffect, useRef } from "react";
import { facilityService, metadataService, sportComplexService } from "../api";
import type { Category, Sport, Surface, Environment, SportComplex } from "../types";
import { ImageUpload } from "./ImageUpload";
import type { ImageUploadRef } from "./ImageUpload";
import WorkingHoursPricing from "./WorkingHoursPricing";
import type { WorkingHours, PricingSlot } from "./WorkingHoursPricing";
import "../styles/CreateWizard.css";

interface CreateFacilityWizardProps {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
    onCancel?: () => void;
}

export default function CreateFacilityWizard({
    onSuccess,
    onError,
    onCancel
}: CreateFacilityWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const imageUploadRef = useRef<ImageUploadRef>(null);

    // Metadata
    const [categories, setCategories] = useState<Category[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [surfaces, setSurfaces] = useState<Surface[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [mySportComplexes, setMySportComplexes] = useState<SportComplex[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    // Step 1: Basic Information
    const [basicInfo, setBasicInfo] = useState({
        name: "",
        sport_complex_id: null as number | null,
        sport_id: 0,
        category_id: 0,
        capacity: 0,
        city: "",
        address: ""
    });    // Step 2: Categories & Characteristics
    const [characteristics, setCharacteristics] = useState({
        surface_id: 0,
        environment_id: 0,
        description: ""
    });

    // Step 3: Working Hours & Pricing
    const [workingHours, setWorkingHours] = useState<WorkingHours[]>([
        { day_type: "weekday", open_time: "08:00", close_time: "22:00" },
        { day_type: "weekend", open_time: "08:00", close_time: "22:00" }
    ]);

    const [pricing, setPricing] = useState<PricingSlot[]>([
        { day_type: "weekday", start_hour: "08:00", end_hour: "22:00", price_per_hour: 20 },
        { day_type: "weekend", start_hour: "08:00", end_hour: "22:00", price_per_hour: 25 }
    ]);    // Step 4: Images
    const [imageUrls, setImageUrls] = useState<string[]>([]);    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cats, spts, surfs, envs, complexes, citiesData] = await Promise.all([
                    metadataService.getCategories(),
                    metadataService.getSports(),
                    metadataService.getSurfaces(),
                    metadataService.getEnvironments(),
                    sportComplexService.getMy(),
                    metadataService.getCities()
                ]);

                setCategories(cats || []);
                setSports(spts || []);
                setSurfaces(surfs || []);
                setEnvironments(envs || []);
                setMySportComplexes(complexes || []);
                setCities(citiesData || []);
            } catch (err) {
                if (onError) {
                    onError((err as Error).message || "Failed to load metadata");
                }
            }
        };

        fetchData();
    }, [onError]);

    const getFilteredCategories = (sportId: number) => {
        if (!sportId) return [];
        return categories.filter(cat => cat.sport_id === sportId);
    };

    const handleSportChange = (sportId: number) => {
        const filteredCategories = getFilteredCategories(sportId);
        setBasicInfo({
            ...basicInfo,
            sport_id: sportId,
            category_id: filteredCategories[0]?.id || 0
        });
    };    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!basicInfo.name.trim()) {
                    if (onError) onError("Facility name is required");
                    return false;
                }
                if (!basicInfo.sport_id) {
                    if (onError) onError("Sport is required");
                    return false;
                }
                if (!basicInfo.category_id) {
                    if (onError) onError("Category is required");
                    return false;
                }
                if (basicInfo.capacity <= 0) {
                    if (onError) onError("Capacity must be greater than 0");
                    return false;
                }
                // If standalone, require city and address
                if (!basicInfo.sport_complex_id) {
                    if (!basicInfo.city.trim()) {
                        if (onError) onError("City is required for standalone facilities");
                        return false;
                    }
                    if (!basicInfo.address.trim()) {
                        if (onError) onError("Address is required for standalone facilities");
                        return false;
                    }
                }
                return true;            case 2:
                if (!characteristics.surface_id) {
                    if (onError) onError("Surface is required");
                    return false;
                }
                if (!characteristics.environment_id) {
                    if (onError) onError("Environment is required");
                    return false;
                }
                if (!characteristics.description.trim()) {
                    if (onError) onError("Description is required");
                    return false;
                }
                return true;

            case 3:
                if (!workingHours || workingHours.length === 0) {
                    if (onError) onError("Working hours are required");
                    return false;
                }
                if (!pricing || pricing.length === 0) {
                    if (onError) onError("At least one pricing interval is required");
                    return false;
                }
                return true;

            case 4:
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
    };    const handleSubmit = async () => {
        if (!validateStep(5)) return;

        setLoading(true);
        try {
            // Upload images if any are selected but not yet uploaded
            let finalImageUrls = imageUrls;
            if (imageUploadRef.current) {
                if (imageUploadRef.current.hasSelectedFiles() && !imageUploadRef.current.hasUploadedImages()) {
                    try {
                        finalImageUrls = await imageUploadRef.current.uploadImages();
                    } catch (err) {
                        if (onError) {
                            onError((err as Error).message || "Failed to upload images");
                        }
                        setLoading(false);
                        return;
                    }
                }
            }            await facilityService.create({
                name: basicInfo.name,
                sport_complex_id: basicInfo.sport_complex_id,
                category_id: basicInfo.category_id,
                surface_id: characteristics.surface_id,
                environment_id: characteristics.environment_id,
                description: characteristics.description,
                capacity: basicInfo.capacity,
                city: basicInfo.city,
                address: basicInfo.address,
                image_urls: finalImageUrls,
                working_hours: workingHours,
                pricing: pricing
            });

            if (onSuccess) {
                onSuccess("Facility created successfully! Waiting for admin approval.");
            }
        } catch (err) {
            if (onError) {
                onError((err as Error).message || "Failed to create facility");
            }
        } finally {
            setLoading(false);
        }
    };    const renderProgressBar = () => (
        <div className="wizard-progress">
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Basic Info</div>
            </div>
            <div className={`step-line ${currentStep > 1 ? 'completed' : ''}`} />
            <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Characteristics</div>
            </div>            <div className={`step-line ${currentStep > 2 ? 'completed' : ''}`} />
            <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Hours & Price</div>
            </div>
            <div className={`step-line ${currentStep > 3 ? 'completed' : ''}`} />
            <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
                <div className="step-number">4</div>
                <div className="step-label">Images</div>
            </div>
            <div className={`step-line ${currentStep > 4 ? 'completed' : ''}`} />
            <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>
                <div className="step-number">5</div>
                <div className="step-label">Review</div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="wizard-step">
            <h3>Step 1: Basic Information</h3>
            <p className="step-description">Enter the basic details about your facility</p>

            <div className="form-group">
                <label>Facility Name *</label>
                <input
                    type="text"
                    placeholder="e.g., Basketball Court A"
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                />
            </div>

            <div className="form-group">
                <label>Sport Complex (Optional)</label>
                <select
                    value={basicInfo.sport_complex_id || ""}
                    onChange={(e) => setBasicInfo({
                        ...basicInfo,
                        sport_complex_id: e.target.value ? parseInt(e.target.value) : null
                    })}
                >
                    <option value="">Standalone (No Complex)</option>
                    {mySportComplexes.filter(c => c.is_verified).map(complex => (
                        <option key={complex.id} value={complex.id}>{complex.name}</option>
                    ))}
                </select>
                <small>Select a sport complex if this facility belongs to one</small>
            </div>

            {!basicInfo.sport_complex_id && (
                <>
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
                    </div>
                </>
            )}

            <div className="form-row">
                <div className="form-group">
                    <label>Sport *</label>
                    <select
                        value={basicInfo.sport_id}
                        onChange={(e) => handleSportChange(parseInt(e.target.value))}
                    >
                        <option value={0}>Select Sport</option>
                        {sports.map(sport => (
                            <option key={sport.id} value={sport.id}>{sport.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Category *</label>
                    <select
                        value={basicInfo.category_id}
                        onChange={(e) => setBasicInfo({ ...basicInfo, category_id: parseInt(e.target.value) })}
                        disabled={!basicInfo.sport_id}
                    >
                        <option value={0}>Select Category</option>
                        {getFilteredCategories(basicInfo.sport_id).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>Capacity (Number of Players) *</label>
                <input
                    type="number"
                    placeholder="e.g., 10"
                    value={basicInfo.capacity || ""}
                    onChange={(e) => setBasicInfo({ ...basicInfo, capacity: parseInt(e.target.value) })}
                    min="1"
                />
                <small>Maximum number of players that can use this facility at once</small>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="wizard-step">
            <h3>Step 2: Categories & Characteristics</h3>
            <p className="step-description">Define the surface type, environment, and description</p>

            <div className="form-row">
                <div className="form-group">
                    <label>Surface Type *</label>
                    <select
                        value={characteristics.surface_id}
                        onChange={(e) => setCharacteristics({ ...characteristics, surface_id: parseInt(e.target.value) })}
                    >
                        <option value={0}>Select Surface</option>
                        {surfaces.map(surf => (
                            <option key={surf.id} value={surf.id}>{surf.name}</option>
                        ))}
                    </select>
                    {characteristics.surface_id > 0 && (
                        <small className="info-text">
                            {surfaces.find(s => s.id === characteristics.surface_id)?.description}
                        </small>
                    )}
                </div>

                <div className="form-group">
                    <label>Environment *</label>
                    <select
                        value={characteristics.environment_id}
                        onChange={(e) => setCharacteristics({ ...characteristics, environment_id: parseInt(e.target.value) })}
                    >
                        <option value={0}>Select Environment</option>
                        {environments.map(env => (
                            <option key={env.id} value={env.id}>{env.name}</option>
                        ))}
                    </select>
                    {characteristics.environment_id > 0 && (
                        <small className="info-text">
                            {environments.find(e => e.id === characteristics.environment_id)?.description}
                        </small>
                    )}
                </div>
            </div>

            <div className="form-group">
                <label>Description *</label>
                <textarea
                    placeholder="Describe your facility, its features, amenities, and any special characteristics..."
                    value={characteristics.description}
                    onChange={(e) => setCharacteristics({ ...characteristics, description: e.target.value })}
                    rows={6}
                />
                <small>Provide a detailed description to help users understand what your facility offers</small>
            </div>
        </div>
    );    const renderStep3 = () => {
        console.log("Rendering Step 3 - Working Hours & Pricing");
        console.log("Current workingHours state:", workingHours);
        console.log("Current pricing state:", pricing);
        
        return (
            <div className="wizard-step">
                <h3>Step 3: Working Hours & Pricing</h3>
                <p className="step-description">Set when your facility is available and pricing intervals</p>

                <WorkingHoursPricing
                    onWorkingHoursChange={setWorkingHours}
                    onPricingChange={setPricing}
                    initialWorkingHours={workingHours}
                    initialPricing={pricing}
                />
            </div>
        );
    };

    const renderStep4 = () => (
        <div className="wizard-step">
            <h3>Step 4: Upload Images</h3>
            <p className="step-description">Add photos of your facility (at least 1 required, up to 5)</p>

            <ImageUpload 
                ref={imageUploadRef}
                onImagesUploaded={setImageUrls} 
                maxImages={5}
                folder="facilities"
                title="Facility Images"
            />

            {imageUrls.length > 0 && (
                <div className="upload-success">
                    ✓ {imageUrls.length} image(s) uploaded successfully
                </div>
            )}        </div>
    );

    const renderStep5 = () => (
        <div className="wizard-step">
            <h3>Step 5: Review & Submit</h3>
            <p className="step-description">Review all information before submitting</p>

            <div className="review-section">
                <div className="review-card">
                    <h4>Basic Information</h4>
                    <div className="review-item">
                        <span className="review-label">Name:</span>
                        <span className="review-value">{basicInfo.name}</span>
                    </div>
                    <div className="review-item">
                        <span className="review-label">Sport:</span>
                        <span className="review-value">{sports.find(s => s.id === basicInfo.sport_id)?.name}</span>
                    </div>
                    <div className="review-item">
                        <span className="review-label">Category:</span>
                        <span className="review-value">{categories.find(c => c.id === basicInfo.category_id)?.name}</span>
                    </div>
                    <div className="review-item">
                        <span className="review-label">Capacity:</span>
                        <span className="review-value">{basicInfo.capacity} players</span>
                    </div>
                    {basicInfo.sport_complex_id ? (
                        <div className="review-item">
                            <span className="review-label">Sport Complex:</span>
                            <span className="review-value">
                                {mySportComplexes.find(c => c.id === basicInfo.sport_complex_id)?.name}
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="review-item">
                                <span className="review-label">City:</span>
                                <span className="review-value">{basicInfo.city}</span>
                            </div>
                            <div className="review-item">
                                <span className="review-label">Address:</span>
                                <span className="review-value">{basicInfo.address}</span>
                            </div>
                        </>
                    )}
                    <button className="btn-edit" onClick={() => setCurrentStep(1)}>Edit</button>
                </div>

                <div className="review-card">
                    <h4>Characteristics</h4>
                    <div className="review-item">
                        <span className="review-label">Surface:</span>
                        <span className="review-value">{surfaces.find(s => s.id === characteristics.surface_id)?.name}</span>
                    </div>
                    <div className="review-item">
                        <span className="review-label">Environment:</span>
                        <span className="review-value">{environments.find(e => e.id === characteristics.environment_id)?.name}</span>
                    </div>
                    <div className="review-item">
                        <span className="review-label">Description:</span>
                        <span className="review-value">{characteristics.description}</span>
                    </div>
                    <button className="btn-edit" onClick={() => setCurrentStep(2)}>Edit</button>                </div>

                <div className="review-card">
                    <h4>Working Hours & Pricing</h4>
                    {workingHours.map((wh, idx) => (
                        <div key={idx} className="review-item">
                            <span className="review-label">{wh.day_type === "weekday" ? "Weekdays:" : "Weekend:"}</span>
                            <span className="review-value">{wh.open_time} - {wh.close_time}</span>
                        </div>
                    ))}
                    <div className="pricing-review-section">
                        <strong>Pricing:</strong>
                        {pricing.filter(p => p.day_type === "weekday").length > 0 && (
                            <div className="pricing-day-review">
                                <em>Weekdays:</em>
                                {pricing.filter(p => p.day_type === "weekday").sort((a, b) => a.start_hour.localeCompare(b.start_hour)).map((slot, idx) => (
                                    <div key={idx} className="pricing-slot-review">
                                        {slot.start_hour} - {slot.end_hour}: <strong>{slot.price_per_hour.toFixed(2)} €/hour</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                        {pricing.filter(p => p.day_type === "weekend").length > 0 && (
                            <div className="pricing-day-review">
                                <em>Weekend:</em>
                                {pricing.filter(p => p.day_type === "weekend").sort((a, b) => a.start_hour.localeCompare(b.start_hour)).map((slot, idx) => (
                                    <div key={idx} className="pricing-slot-review">
                                        {slot.start_hour} - {slot.end_hour}: <strong>{slot.price_per_hour.toFixed(2)} €/hour</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="btn-edit" onClick={() => setCurrentStep(3)}>Edit</button>
                </div>

                <div className="review-card">
                    <h4>Images ({imageUrls.length})</h4>
                    <div className="review-images">
                        {imageUrls.map((url, index) => (
                            <img key={index} src={url} alt={`Preview ${index + 1}`} className="review-image-thumb" />
                        ))}
                    </div>                    <button className="btn-edit" onClick={() => setCurrentStep(4)}>Edit</button>
                </div>
            </div>

            <div className="submission-note">
                <strong>Note:</strong> Your facility will be submitted for admin approval. 
                You will be notified once it's approved and active.
            </div>
        </div>
    );

    return (
        <div className="create-wizard">
            {renderProgressBar()}            <div className="wizard-content">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {currentStep === 5 && renderStep5()}
            </div>            <div className="wizard-actions">
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
                
                {currentStep < 5 ? (
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
