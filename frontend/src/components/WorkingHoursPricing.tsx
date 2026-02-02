import { useState, useEffect } from "react";
import "../styles/WorkingHoursPricing.css";

export interface WorkingHours {
    day_type: "weekday" | "weekend";
    open_time: string;  // HH:MM format
    close_time: string; // HH:MM format
}

export interface PricingSlot {
    day_type: "weekday" | "weekend";
    start_hour: string;  // HH:MM format
    end_hour: string;    // HH:MM format
    price_per_hour: number;
}

interface WorkingHoursPricingProps {
    onWorkingHoursChange: (hours: WorkingHours[]) => void;
    onPricingChange: (pricing: PricingSlot[]) => void;
    initialWorkingHours?: WorkingHours[];
    initialPricing?: PricingSlot[];
}

export default function WorkingHoursPricing({
    onWorkingHoursChange,
    onPricingChange,
    initialWorkingHours,
    initialPricing
}: WorkingHoursPricingProps) {
    console.log("WorkingHoursPricing component rendered");
    console.log("Initial working hours:", initialWorkingHours);
    console.log("Initial pricing:", initialPricing);
    
    // Working Hours State
    const [workingHours, setWorkingHours] = useState<WorkingHours[]>(
        initialWorkingHours || [
            { day_type: "weekday", open_time: "08:00", close_time: "22:00" },
            { day_type: "weekend", open_time: "09:00", close_time: "20:00" }
        ]
    );

    // Pricing State
    const [pricing, setPricing] = useState<PricingSlot[]>(
        initialPricing || []
    );

    // Initialize pricing slots when working hours change
    useEffect(() => {
        if (!initialPricing && pricing.length === 0) {
            const initialPricingSlots: PricingSlot[] = workingHours.map(wh => ({
                day_type: wh.day_type,
                start_hour: wh.open_time,
                end_hour: wh.close_time,
                price_per_hour: 20.00
            }));
            setPricing(initialPricingSlots);
        }
    }, []);

    // Notify parent of changes
    useEffect(() => {
        onWorkingHoursChange(workingHours);
    }, [workingHours, onWorkingHoursChange]);

    useEffect(() => {
        onPricingChange(pricing);
    }, [pricing, onPricingChange]);

    const updateWorkingHours = (dayType: "weekday" | "weekend", field: "open_time" | "close_time", value: string) => {
        const updated = workingHours.map(wh => 
            wh.day_type === dayType ? { ...wh, [field]: value } : wh
        );
        setWorkingHours(updated);

        // Update pricing slots for this day type
        const dayWorkingHours = updated.find(wh => wh.day_type === dayType);
        if (dayWorkingHours) {
            const updatedPricing = pricing.map(p => {
                if (p.day_type === dayType) {
                    // Adjust pricing slots to fit within new working hours
                    let newStart = p.start_hour;
                    let newEnd = p.end_hour;

                    if (p.start_hour < dayWorkingHours.open_time) {
                        newStart = dayWorkingHours.open_time;
                    }
                    if (p.end_hour > dayWorkingHours.close_time) {
                        newEnd = dayWorkingHours.close_time;
                    }

                    return { ...p, start_hour: newStart, end_hour: newEnd };
                }
                return p;
            });
            setPricing(updatedPricing);
        }
    };

    const addPricingSlot = (dayType: "weekday" | "weekend") => {
        const daySlots = pricing.filter(p => p.day_type === dayType).sort((a, b) => 
            a.start_hour.localeCompare(b.start_hour)
        );
        
        const workingHour = workingHours.find(wh => wh.day_type === dayType);
        if (!workingHour) return;

        let newStartHour: string;
        
        if (daySlots.length === 0) {
            // First slot
            newStartHour = incrementTime(workingHour.open_time, 60);
        } else {
            // Find the last slot
            const lastSlot = daySlots[daySlots.length - 1];
            newStartHour = incrementTime(lastSlot.start_hour, 60);
        }

        // Ensure new start is before close time
        if (newStartHour >= workingHour.close_time) {
            return; // Cannot add more slots
        }

        // Update the previous slot's end hour
        const updatedPricing = pricing.map(p => {
            if (p.day_type === dayType && p.end_hour === workingHour.close_time) {
                return { ...p, end_hour: newStartHour };
            }
            return p;
        });

        // Add new slot
        const newSlot: PricingSlot = {
            day_type: dayType,
            start_hour: newStartHour,
            end_hour: workingHour.close_time,
            price_per_hour: 20.00
        };

        setPricing([...updatedPricing, newSlot]);
    };

    const removePricingSlot = (dayType: "weekday" | "weekend", startHour: string) => {
        const daySlots = pricing.filter(p => p.day_type === dayType).sort((a, b) => 
            a.start_hour.localeCompare(b.start_hour)
        );

        if (daySlots.length <= 1) {
            return; // Must have at least one slot
        }

        const slotIndex = daySlots.findIndex(p => p.start_hour === startHour);
        if (slotIndex === -1) return;

        const removedSlot = daySlots[slotIndex];
        const previousSlot = slotIndex > 0 ? daySlots[slotIndex - 1] : null;

        let updatedPricing = pricing.filter(p => 
            !(p.day_type === dayType && p.start_hour === startHour)
        );

        // Extend previous slot to cover the gap
        if (previousSlot) {
            updatedPricing = updatedPricing.map(p => {
                if (p.day_type === dayType && p.start_hour === previousSlot.start_hour) {
                    return { ...p, end_hour: removedSlot.end_hour };
                }
                return p;
            });
        }

        setPricing(updatedPricing);
    };

    const updatePricingSlot = (dayType: "weekday" | "weekend", startHour: string, field: keyof PricingSlot, value: any) => {
        if (field === "start_hour") {
            // Chain reaction: update end hour of previous slot
            const daySlots = pricing.filter(p => p.day_type === dayType).sort((a, b) => 
                a.start_hour.localeCompare(b.start_hour)
            );
            
            const slotIndex = daySlots.findIndex(p => p.start_hour === startHour);
            if (slotIndex === -1) return;

            const updatedPricing = pricing.map(p => {
                // Update this slot's start hour
                if (p.day_type === dayType && p.start_hour === startHour) {
                    return { ...p, start_hour: value };
                }
                // Update previous slot's end hour
                if (slotIndex > 0 && p.day_type === dayType && p.start_hour === daySlots[slotIndex - 1].start_hour) {
                    return { ...p, end_hour: value };
                }
                return p;
            });
            
            setPricing(updatedPricing);
        } else {
            // Update price
            const updatedPricing = pricing.map(p => 
                p.day_type === dayType && p.start_hour === startHour ? { ...p, [field]: value } : p
            );
            setPricing(updatedPricing);
        }
    };

    const incrementTime = (time: string, minutes: number): string => {
        const [hours, mins] = time.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMins = totalMinutes % 60;
        return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
    };

    const renderWorkingHours = () => (
        <div className="working-hours-section">
            <h4>Working Hours</h4>
            <p className="section-description">Define when the facility is available for bookings</p>

            <div className="working-hours-grid">
                {workingHours.map(wh => (
                    <div key={wh.day_type} className="working-hours-card">
                        <h5>{wh.day_type === "weekday" ? "Weekdays (Mon-Fri)" : "Weekend (Sat-Sun)"}</h5>
                        <div className="time-inputs">
                            <div className="time-input-group">
                                <label>Open Time</label>
                                <input
                                    type="time"
                                    value={wh.open_time}
                                    onChange={(e) => updateWorkingHours(wh.day_type, "open_time", e.target.value)}
                                />
                            </div>
                            <span className="time-separator">—</span>
                            <div className="time-input-group">
                                <label>Close Time</label>
                                <input
                                    type="time"
                                    value={wh.close_time}
                                    onChange={(e) => updateWorkingHours(wh.day_type, "close_time", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPricing = (dayType: "weekday" | "weekend") => {
        const daySlots = pricing.filter(p => p.day_type === dayType).sort((a, b) => 
            a.start_hour.localeCompare(b.start_hour)
        );
        const workingHour = workingHours.find(wh => wh.day_type === dayType);
        if (!workingHour) return null;

        const canAddMore = daySlots.length === 0 || 
            daySlots[daySlots.length - 1].end_hour < workingHour.close_time;

        return (
            <div className="pricing-card">
                <div className="pricing-header">
                    <h5>{dayType === "weekday" ? "Weekdays (Mon-Fri)" : "Weekend (Sat-Sun)"}</h5>
                    {canAddMore && (
                        <button 
                            type="button" 
                            className="btn-add-slot"
                            onClick={() => addPricingSlot(dayType)}
                        >
                            + Add Interval
                        </button>
                    )}
                </div>

                <div className="pricing-slots">
                    {daySlots.map((slot, index) => (
                        <div key={`${slot.day_type}-${slot.start_hour}`} className="pricing-slot">
                            <div className="slot-number">{index + 1}</div>
                            
                            <div className="slot-time-range">
                                {index === 0 ? (
                                    <span className="time-display">{slot.start_hour}</span>
                                ) : (
                                    <input
                                        type="time"
                                        value={slot.start_hour}
                                        min={index > 0 ? incrementTime(daySlots[index - 1].start_hour, 30) : workingHour.open_time}
                                        max={slot.end_hour}
                                        onChange={(e) => updatePricingSlot(dayType, slot.start_hour, "start_hour", e.target.value)}
                                    />
                                )}
                                <span className="time-separator">→</span>
                                <span className="time-display">{slot.end_hour}</span>
                            </div>

                            <div className="slot-price">
                                <input
                                    type="number"
                                    value={slot.price_per_hour}
                                    min="0"
                                    step="0.50"
                                    onChange={(e) => updatePricingSlot(dayType, slot.start_hour, "price_per_hour", parseFloat(e.target.value) || 0)}
                                />
                                <span className="currency">€/hour</span>
                            </div>

                            {daySlots.length > 1 && (
                                <button
                                    type="button"
                                    className="btn-remove-slot"
                                    onClick={() => removePricingSlot(dayType, slot.start_hour)}
                                    title="Remove interval"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="working-hours-pricing-container">
            {renderWorkingHours()}

            <div className="pricing-section">
                <h4>Pricing</h4>
                <p className="section-description">
                    Set prices for different time intervals. First interval starts at opening time, last one ends at closing time.
                </p>

                <div className="pricing-grid">
                    {renderPricing("weekday")}
                    {renderPricing("weekend")}
                </div>
            </div>
        </div>
    );
}
