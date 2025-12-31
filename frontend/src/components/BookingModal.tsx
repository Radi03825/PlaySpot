import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getFacilityAvailability, createReservation } from "../services/api";
import type { DayAvailability, AvailableSlot } from "../types";
import "../styles/BookingModal.css";

interface BookingModalProps {
    facilityId: number;
    facilityName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BookingModal({ facilityId, facilityName, onClose, onSuccess }: BookingModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState("");
    const [totalPrice, setTotalPrice] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [booking, setBooking] = useState(false);
    const [dayAvailability, setDayAvailability] = useState<DayAvailability | null>(null);

    // Set today's date on mount
    useEffect(() => {
        setSelectedDate(new Date());
    }, []);

    useEffect(() => {
        if (selectedDate) {
            console.log("Fetching availability for date:", selectedDate.toISOString().split('T')[0]);
            fetchDayAvailability(selectedDate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, facilityId]);

    const fetchDayAvailability = async (date: Date) => {
        try {
            setLoadingSlots(true);
            setError("");
            setSelectedSlots([]);
            setTotalPrice(0);

            const dateStr = date.toISOString().split('T')[0];
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];

            console.log("Fetching availability from", dateStr, "to", nextDayStr);
            const data = await getFacilityAvailability(facilityId, dateStr, nextDayStr);
            console.log("Received availability data:", data);

            if (data && data.length > 0) {
                console.log("Day availability:", data[0]);
                console.log("Is open:", data[0].is_open);
                console.log("Slots count:", data[0].slots?.length);
                setDayAvailability(data[0]);
            } else {
                console.log("No availability data received");
                setDayAvailability(null);
            }
        } catch (err) {
            console.error("Error fetching availability:", err);
            setError(err instanceof Error ? err.message : "Failed to load availability");
            setDayAvailability(null);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleSlotToggle = (slot: AvailableSlot) => {
        if (!slot.available) return;

        const slotKey = `${slot.start_time}-${slot.end_time}`;
        const isSelected = selectedSlots.includes(slotKey);

        let newSlots: string[];
        if (isSelected) {
            newSlots = selectedSlots.filter(s => s !== slotKey);
        } else {
            newSlots = [...selectedSlots, slotKey].sort();
        }

        setSelectedSlots(newSlots);

        // Calculate total price - sum of all selected slots' prices
        const daySlots = dayAvailability?.slots || [];
        const price = newSlots.reduce((total, key) => {
            const slotData = daySlots.find(s => `${s.start_time}-${s.end_time}` === key);
            if (slotData) {
                // Calculate hours for this slot
                const [startHour, startMin] = slotData.start_time.split(':').map(Number);
                const [endHour, endMin] = slotData.end_time.split(':').map(Number);
                const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
                return total + (slotData.price_per_hour * hours);
            }
            return total;
        }, 0);
        setTotalPrice(price);
    };

    const handleBooking = () => {
        if (!selectedDate) {
            setError("Please select a date");
            return;
        }
        if (selectedSlots.length === 0) {
            setError("Please select at least one time slot");
            return;
        }
        setError("");
        setShowConfirmation(true);
    };

    const confirmBooking = async () => {
        if (selectedSlots.length === 0 || !selectedDate) return;

        try {
            setBooking(true);
            setError("");

            const daySlots = dayAvailability?.slots || [];
            const sortedSlots = selectedSlots
                .map(key => daySlots.find(s => `${s.start_time}-${s.end_time}` === key))
                .filter(Boolean) as AvailableSlot[];

            if (sortedSlots.length === 0) {
                throw new Error("No valid slots selected");
            }

            // Group consecutive slots into separate bookings
            const consecutiveGroups: AvailableSlot[][] = [];
            let currentGroup: AvailableSlot[] = [sortedSlots[0]];

            for (let i = 1; i < sortedSlots.length; i++) {
                const prevSlot = sortedSlots[i - 1];
                const currentSlot = sortedSlots[i];

                // Check if current slot starts exactly when previous slot ends (consecutive)
                if (prevSlot.end_time === currentSlot.start_time) {
                    currentGroup.push(currentSlot);
                } else {
                    // Non-consecutive, start a new group
                    consecutiveGroups.push(currentGroup);
                    currentGroup = [currentSlot];
                }
            }
            consecutiveGroups.push(currentGroup);

            const dateStr = selectedDate.toISOString().split('T')[0];

            // Create a reservation for each consecutive group
            for (const group of consecutiveGroups) {
                const startTime = group[0].start_time;
                const endTime = group[group.length - 1].end_time;

                // Parse times and construct local dates (not UTC)
                const [startHour, startMin] = startTime.split(':').map(Number);
                const [endHour, endMin] = endTime.split(':').map(Number);

                const [year, month, day] = dateStr.split('-').map(Number);

                // Create dates in LOCAL timezone (Sofia time)
                const startDateTime = new Date(year, month - 1, day, startHour, startMin, 0);
                const endDateTime = new Date(year, month - 1, day, endHour, endMin, 0);

                await createReservation({
                    facility_id: facilityId,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                });
            }

            // Success - parent component will show the alert
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create reservation");
            setShowConfirmation(false);
        } finally {
            setBooking(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Book {facilityName}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && <div className="error-message">{error}</div>}

                    <div className="booking-content">
                        <div className="date-selector">
                            <label>Select Date:</label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date: Date | null) => {
                                    setSelectedDate(date);
                                }}
                                minDate={new Date()}
                                dateFormat="EEEE, MMMM d, yyyy"
                                inline
                            />
                        </div>

                        <div className="slots-section">
                            {!selectedDate && (
                                <div className="info-message">Please select a date to view available time slots</div>
                            )}

                            {selectedDate && loadingSlots && (
                                <div className="loading">Loading time slots...</div>
                            )}

                            {selectedDate && !loadingSlots && dayAvailability && dayAvailability.is_open && dayAvailability.slots && dayAvailability.slots.length > 0 && (
                                <div className="slots-container">
                                    <h3>Available Time Slots</h3>
                                    <div className="slots-grid">
                                        {dayAvailability.slots.map((slot, index) => {
                                            const slotKey = `${slot.start_time}-${slot.end_time}`;
                                            const isSelected = selectedSlots.includes(slotKey);
                                            return (
                                                <button
                                                    key={index}
                                                    className={`slot-btn ${!slot.available ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleSlotToggle(slot)}
                                                    disabled={!slot.available}
                                                >
                                                    <div className="slot-time">{slot.start_time} - {slot.end_time}</div>
                                                    <div className="slot-price">€{slot.price_per_hour.toFixed(2)}/hr</div>
                                                    {!slot.available && <div className="slot-status">Booked</div>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedDate && !loadingSlots && dayAvailability && dayAvailability.is_open && (!dayAvailability.slots || dayAvailability.slots.length === 0) && (
                                <div className="closed-message">
                                    <p>No time slots available for this date.</p>
                                    <p style={{fontSize: '0.9rem', color: '#999', marginTop: '0.5rem'}}>
                                        The facility may not have pricing configured. Please contact support.
                                    </p>
                                </div>
                            )}

                            {selectedDate && !loadingSlots && dayAvailability && !dayAvailability.is_open && (
                                <div className="closed-message">This facility is closed on this date.</div>
                            )}

                            {selectedDate && !loadingSlots && !dayAvailability && (
                                <div className="closed-message">
                                    <p>No availability information for this date.</p>
                                    <p style={{fontSize: '0.9rem', color: '#999', marginTop: '0.5rem'}}>
                                        The facility may not have schedules configured. Please try another date or contact support.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <div className="booking-summary">
                        <div className="summary-item">
                            <span>Selected Date:</span>
                            <span>{selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'None'}</span>
                        </div>
                        <div className="summary-item">
                            <span>Selected Slots:</span>
                            <span>{selectedSlots.length}</span>
                        </div>
                        <div className="summary-item total">
                            <span>Total Price:</span>
                            <span>€{totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button
                            className="btn-book"
                            onClick={handleBooking}
                            disabled={!selectedDate || selectedSlots.length === 0 || booking}
                        >
                            {booking ? 'Booking...' : 'Book Now'}
                        </button>
                    </div>
                </div>

                {showConfirmation && (
                    <div className="confirmation-overlay">
                        <div className="confirmation-box">
                            <h3>Confirm Booking</h3>
                            <p>Are you sure you want to book this time slot?</p>
                            <p className="confirmation-details">
                                <strong>Date:</strong> {selectedDate?.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}<br />
                                <strong>Slots:</strong> {selectedSlots.length}<br />
                                <strong>Total:</strong> €{totalPrice.toFixed(2)}
                            </p>
                            <div className="confirmation-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setShowConfirmation(false)}
                                    disabled={booking}
                                >
                                    No
                                </button>
                                <button
                                    className="btn-confirm"
                                    onClick={confirmBooking}
                                    disabled={booking}
                                >
                                    {booking ? 'Processing...' : 'Yes, Book It'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

