import { useState, useRef } from "react";
import type { Category, Sport, Surface, Environment } from "../types";
import { ImageUpload } from "./ImageUpload";
import type { ImageUploadRef } from "./ImageUpload";
import WorkingHoursPricing from "./WorkingHoursPricing";
import type { WorkingHours, PricingSlot } from "./WorkingHoursPricing";
import "../styles/AddFacilitySubForm.css";

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

interface AddFacilitySubFormProps {
    sports: Sport[];
    categories: Category[];
    surfaces: Surface[];
    environments: Environment[];
    onSave: (facility: FacilityData) => void;
    onCancel: () => void;
    initialData?: Partial<FacilityData>;
}

export default function AddFacilitySubForm({
    sports,
    categories,
    surfaces,
    environments,
    onSave,
    onCancel,
    initialData
}: AddFacilitySubFormProps) {    const [currentSubStep, setCurrentSubStep] = useState(1);
    const [facilityData, setFacilityData] = useState<FacilityData>({
        name: initialData?.name || "",
        sport_id: initialData?.sport_id || sports[0]?.id || 0,
        category_id: initialData?.category_id || categories[0]?.id || 0,
        surface_id: initialData?.surface_id || surfaces[0]?.id || 0,
        environment_id: initialData?.environment_id || environments[0]?.id || 0,
        description: initialData?.description || "",
        capacity: initialData?.capacity || 0,
        image_urls: initialData?.image_urls || [],
        working_hours: initialData?.working_hours || [],
        pricing: initialData?.pricing || []
    });

    const [errors, setErrors] = useState<string[]>([]);
    const imageUploadRef = useRef<ImageUploadRef>(null);

    const getFilteredCategories = (sportId: number) => {
        if (!sportId) return [];
        return categories.filter(cat => cat.sport_id === sportId);
    };

    const handleSportChange = (sportId: number) => {
        const filteredCategories = getFilteredCategories(sportId);
        setFacilityData({
            ...facilityData,
            sport_id: sportId,
            category_id: filteredCategories[0]?.id || 0
        });
    };    const validateSubStep = (step: number): boolean => {
        const newErrors: string[] = [];

        switch (step) {
            case 1:
                if (!facilityData.name.trim()) {
                    newErrors.push("Facility name is required");
                }
                if (!facilityData.sport_id) {
                    newErrors.push("Sport is required");
                }
                if (!facilityData.category_id) {
                    newErrors.push("Category is required");
                }
                break;

            case 2:
                if (!facilityData.surface_id) {
                    newErrors.push("Surface is required");
                }
                if (!facilityData.environment_id) {
                    newErrors.push("Environment is required");
                }
                if (facilityData.capacity <= 0) {
                    newErrors.push("Capacity must be greater than 0");
                }                // Description is now optional - no validation needed
                break;

            case 3:
                // Working hours and pricing validation
                if (!facilityData.working_hours || facilityData.working_hours.length === 0) {
                    newErrors.push("Working hours are required");
                }
                if (!facilityData.pricing || facilityData.pricing.length === 0) {
                    newErrors.push("At least one pricing interval is required");
                }
                break;

            case 4:
                // Images are optional - no validation needed
                break;

            case 5:
                // Final review - no additional validation
                break;
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const nextSubStep = () => {
        if (validateSubStep(currentSubStep)) {
            setCurrentSubStep(currentSubStep + 1);
            setErrors([]);
        }
    };

    const prevSubStep = () => {
        setCurrentSubStep(currentSubStep - 1);
        setErrors([]);
    };    const handleSave = () => {
        if (validateSubStep(5)) {
            onSave(facilityData);
        }
    };    const renderSubStepIndicator = () => (
        <div className="sub-wizard-steps">
            <div className={`sub-step ${currentSubStep >= 1 ? 'active' : ''}`}>
                <div className="sub-step-dot">1</div>
                <span>Sport & Name</span>
            </div>
            <div className="sub-step-line" />
            <div className={`sub-step ${currentSubStep >= 2 ? 'active' : ''}`}>
                <div className="sub-step-dot">2</div>
                <span>Details</span>
            </div>            <div className="sub-step-line" />
            <div className={`sub-step ${currentSubStep >= 3 ? 'active' : ''}`}>
                <div className="sub-step-dot">3</div>
                <span>Hours & Price</span>
            </div>
            <div className="sub-step-line" />
            <div className={`sub-step ${currentSubStep >= 4 ? 'active' : ''}`}>
                <div className="sub-step-dot">4</div>
                <span>Images</span>
            </div>
            <div className="sub-step-line" />
            <div className={`sub-step ${currentSubStep >= 5 ? 'active' : ''}`}>
                <div className="sub-step-dot">5</div>
                <span>Review</span>
            </div>
        </div>
    );

    return (
        <div className="sub-wizard-overlay">
            <div className="sub-wizard-content">
                <h3>Add Facility</h3>
                
                {renderSubStepIndicator()}

                {errors.length > 0 && (
                    <div className="sub-wizard-errors">
                        {errors.map((error, index) => (
                            <div key={index} className="error-item">• {error}</div>
                        ))}
                    </div>
                )}

                <div className="sub-wizard-body">
                    {currentSubStep === 1 && (
                        <div className="sub-step-content">
                            <div className="form-group">
                                <label>Facility Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Basketball Court A"
                                    value={facilityData.name}
                                    onChange={(e) => setFacilityData({ ...facilityData, name: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Sport *</label>
                                    <select
                                        value={facilityData.sport_id}
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
                                        value={facilityData.category_id}
                                        onChange={(e) => setFacilityData({ ...facilityData, category_id: parseInt(e.target.value) })}
                                        disabled={!facilityData.sport_id}
                                    >
                                        <option value={0}>Select Category</option>
                                        {getFilteredCategories(facilityData.sport_id).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}                    {currentSubStep === 2 && (
                        <div className="sub-step-content">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Surface *</label>
                                    <select
                                        value={facilityData.surface_id}
                                        onChange={(e) => setFacilityData({ ...facilityData, surface_id: parseInt(e.target.value) })}
                                    >
                                        <option value={0}>Select Surface</option>
                                        {surfaces.map(surf => (
                                            <option key={surf.id} value={surf.id}>{surf.name}</option>
                                        ))}
                                    </select>
                                    {facilityData.surface_id > 0 && (
                                        <small className="info-text">
                                            {surfaces.find(s => s.id === facilityData.surface_id)?.description}
                                        </small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Environment *</label>
                                    <select
                                        value={facilityData.environment_id}
                                        onChange={(e) => setFacilityData({ ...facilityData, environment_id: parseInt(e.target.value) })}
                                    >
                                        <option value={0}>Select Environment</option>
                                        {environments.map(env => (
                                            <option key={env.id} value={env.id}>{env.name}</option>
                                        ))}
                                    </select>
                                    {facilityData.environment_id > 0 && (
                                        <small className="info-text">
                                            {environments.find(e => e.id === facilityData.environment_id)?.description}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Capacity (Players) *</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 10"
                                    value={facilityData.capacity || ""}
                                    onChange={(e) => setFacilityData({ ...facilityData, capacity: parseInt(e.target.value) || 0 })}
                                    min="1"
                                />
                                <small>Maximum number of players</small>
                            </div>

                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea
                                    placeholder="Describe this facility, its features, equipment, and any special characteristics..."
                                    value={facilityData.description}
                                    onChange={(e) => setFacilityData({ ...facilityData, description: e.target.value })}
                                    rows={6}
                                />
                                <small>Provide details to help users understand what this facility offers</small>
                            </div>
                        </div>                    )}

                    {currentSubStep === 3 && (
                        <div className="sub-step-content">
                            <WorkingHoursPricing
                                onWorkingHoursChange={(hours) => setFacilityData({ ...facilityData, working_hours: hours })}
                                onPricingChange={(pricing) => setFacilityData({ ...facilityData, pricing: pricing })}
                                initialWorkingHours={facilityData.working_hours}
                                initialPricing={facilityData.pricing}
                            />
                        </div>
                    )}

                    {currentSubStep === 4 && (
                        <div className="sub-step-content">
                            <div className="form-group">
                                <label>Facility Images (Optional)</label>
                                <ImageUpload
                                    ref={imageUploadRef}
                                    onImagesUploaded={(urls: string[]) => setFacilityData({ ...facilityData, image_urls: urls })}
                                    maxImages={5}
                                    folder="facilities"
                                    title="Upload Facility Images"
                                />
                                <small>Upload images of this facility to help users see what it looks like</small>
                            </div>
                        </div>
                    )}

                    {currentSubStep === 5 && (
                        <div className="sub-step-content">
                            <h4>Review Facility Details</h4>
                            <p className="step-description">Please review all the information before adding this facility</p>

                            <div className="facility-summary">
                                <div className="summary-section">
                                    <h5>Basic Information</h5>
                                    <div className="summary-item">
                                        <strong>Name:</strong> {facilityData.name}
                                    </div>
                                    <div className="summary-item">
                                        <strong>Sport:</strong> {sports.find(s => s.id === facilityData.sport_id)?.name}
                                    </div>
                                    <div className="summary-item">
                                        <strong>Category:</strong> {categories.find(c => c.id === facilityData.category_id)?.name}
                                    </div>
                                </div>

                                <div className="summary-section">
                                    <h5>Facility Details</h5>
                                    <div className="summary-item">
                                        <strong>Surface:</strong> {surfaces.find(s => s.id === facilityData.surface_id)?.name}
                                    </div>
                                    <div className="summary-item">
                                        <strong>Environment:</strong> {environments.find(e => e.id === facilityData.environment_id)?.name}
                                    </div>
                                    <div className="summary-item">
                                        <strong>Capacity:</strong> {facilityData.capacity} players
                                    </div>
                                </div>                                {facilityData.description && (
                                    <div className="summary-section">
                                        <h5>Description</h5>
                                        <p className="description-text">{facilityData.description}</p>
                                    </div>
                                )}

                                {facilityData.working_hours && facilityData.working_hours.length > 0 && (
                                    <div className="summary-section">
                                        <h5>Working Hours</h5>
                                        {facilityData.working_hours.map((wh, idx) => (
                                            <div key={idx} className="summary-item">
                                                <strong>{wh.day_type === "weekday" ? "Weekdays" : "Weekend"}:</strong> {wh.open_time} - {wh.close_time}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {facilityData.pricing && facilityData.pricing.length > 0 && (
                                    <div className="summary-section">
                                        <h5>Pricing</h5>
                                        <div className="pricing-review">
                                            <div className="pricing-day-group">
                                                <strong>Weekdays:</strong>
                                                {facilityData.pricing
                                                    .filter(p => p.day_type === "weekday")
                                                    .sort((a, b) => a.start_hour.localeCompare(b.start_hour))
                                                    .map((slot, idx) => (
                                                        <div key={idx} className="summary-item pricing-item">
                                                            {slot.start_hour} - {slot.end_hour}: <span className="price-highlight">{slot.price_per_hour.toFixed(2)} €/hour</span>
                                                        </div>
                                                    ))}
                                            </div>
                                            <div className="pricing-day-group">
                                                <strong>Weekend:</strong>
                                                {facilityData.pricing
                                                    .filter(p => p.day_type === "weekend")
                                                    .sort((a, b) => a.start_hour.localeCompare(b.start_hour))
                                                    .map((slot, idx) => (
                                                        <div key={idx} className="summary-item pricing-item">
                                                            {slot.start_hour} - {slot.end_hour}: <span className="price-highlight">{slot.price_per_hour.toFixed(2)} €/hour</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {facilityData.image_urls && facilityData.image_urls.length > 0 && (
                                    <div className="summary-section">
                                        <h5>Images</h5>
                                        <div className="summary-images">
                                            {facilityData.image_urls.map((url, idx) => (
                                                <img key={idx} src={url} alt={`Facility ${idx + 1}`} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>                <div className="sub-wizard-actions">
                    <button type="button" className="btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    
                    <div className="action-right">
                        {currentSubStep > 1 && (
                            <button type="button" className="btn-secondary" onClick={prevSubStep}>
                                ← Back
                            </button>
                        )}
                          {currentSubStep < 5 ? (
                            <button type="button" className="btn-primary" onClick={nextSubStep}>
                                Next →
                            </button>
                        ) : (
                            <button type="button" className="btn-success" onClick={handleSave}>
                                ✓ Add Facility
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
