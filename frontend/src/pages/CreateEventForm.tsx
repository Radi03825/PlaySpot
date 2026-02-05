import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Sport, Reservation } from '../types';
import { eventService, metadataService, reservationService } from '../api';
import '../styles/CreateEventForm.css';

export default function CreateEventForm() {
    const navigate = useNavigate();
    const [sports, setSports] = useState<Sport[]>([]);
    const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([]);
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedReservationForPayment, setSelectedReservationForPayment] = useState<Reservation | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        sport_id: '',
        start_time: '',
        end_time: '',
        max_participants: '10',
        location_type: 'booking', // 'booking' or 'external'
        related_booking_id: '',
        address: ''
    });

    useEffect(() => {
        fetchSports();
        fetchUpcomingReservations();
    }, []);    const fetchSports = async () => {
        try {
            const data = await metadataService.getSports();
            setSports(data);
        } catch (err) {
            console.error('Failed to fetch sports:', err);
        }
    };    const fetchUpcomingReservations = async () => {
        try {
            const data = await reservationService.getUpcoming();
            setUpcomingReservations(data.reservations || []);
            setPendingCount(data.pending_count || 0);
        } catch (err) {
            console.error('Failed to fetch reservations:', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // If changing booking selection, auto-fill sport
        if (name === 'related_booking_id' && value) {
            const booking = upcomingReservations.find(r => r.id === Number(value));
            if (booking && booking.facility_sport_id) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    sport_id: booking.facility_sport_id!.toString()
                }));
                return;
            }
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDeselectBooking = () => {
        setFormData(prev => ({
            ...prev,
            related_booking_id: '',
            sport_id: '' // Clear sport when deselecting booking
        }));
    };

    const selectedReservation = upcomingReservations.find(
        r => r.id === Number(formData.related_booking_id)
    );

    const openPaymentModal = (reservation: Reservation) => {
        setSelectedReservationForPayment(reservation);
        setPaymentModalOpen(true);
    };

    const handlePayment = async (paymentMethod: 'on_place' | 'card') => {
        if (!selectedReservationForPayment) return;

        try {
            setProcessingPayment(true);
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:8081/api/reservations/${selectedReservationForPayment.id}/pay`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ payment_method: paymentMethod }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process payment');
            }

            // Refresh reservations and close modal
            await fetchUpcomingReservations();
            setPaymentModalOpen(false);
            setSelectedReservationForPayment(null);
            
            // If the paid booking was selected, keep it selected
            if (formData.related_booking_id === selectedReservationForPayment.id.toString()) {
                setFormData(prev => ({ ...prev, related_booking_id: selectedReservationForPayment.id.toString() }));
            }
            
            alert('Payment successful! You can now use this booking for your event.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process payment');
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.title || !formData.sport_id || !formData.max_participants) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.location_type === 'external') {
            if (!formData.address || !formData.start_time || !formData.end_time) {
                setError('Please provide address, start time and end time for external location');
                return;
            }
        } else if (formData.location_type === 'booking') {
            if (!formData.related_booking_id) {
                setError('Please select a booking');
                return;
            }
        }

        try {
            setLoading(true);
            const eventData: any = {
                title: formData.title,
                description: formData.description || undefined,
                sport_id: Number(formData.sport_id),
                max_participants: Number(formData.max_participants),
                location_type: formData.location_type
            };

            if (formData.location_type === 'booking') {
                const selectedReservation = upcomingReservations.find(
                    r => r.id === Number(formData.related_booking_id)
                );
                if (selectedReservation) {
                    eventData.related_booking_id = Number(formData.related_booking_id);
                    eventData.start_time = selectedReservation.start_time;
                    eventData.end_time = selectedReservation.end_time;
                }
            } else {
                eventData.address = formData.address;
                eventData.start_time = new Date(formData.start_time).toISOString();
                eventData.end_time = new Date(formData.end_time).toISOString();
            }            const result = await eventService.create(eventData);
            navigate(`/events/${result.id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-event-page">
            <div className="create-event-container">
                <h1>Create New Event</h1>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="event-form">
                    <div className="form-group">
                        <label htmlFor="title">Event Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Friday Night Football"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Tell participants what to expect..."
                            rows={4}
                        />
                    </div>                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="sport_id">Sport *</label>
                            <select
                                id="sport_id"
                                name="sport_id"
                                value={formData.sport_id}
                                onChange={handleInputChange}
                                required
                                disabled={formData.location_type === 'booking' && !!formData.related_booking_id}
                                className={formData.location_type === 'booking' && !!formData.related_booking_id ? 'disabled-field' : ''}
                            >
                                <option value="">Select a sport</option>
                                {sports.map(sport => (
                                    <option key={sport.id} value={sport.id}>
                                        {sport.name}
                                    </option>
                                ))}
                            </select>
                            {formData.location_type === 'booking' && !!formData.related_booking_id && (
                                <small className="info-text">Sport is automatically set from your selected booking</small>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="max_participants">Required Participants *</label>
                            <input
                                type="number"
                                id="max_participants"
                                name="max_participants"
                                value={formData.max_participants}
                                onChange={handleInputChange}
                                min="2"
                                required
                            />
                            <small>Number of people needed to play this sport</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Location Type *</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="location_type"
                                    value="booking"
                                    checked={formData.location_type === 'booking'}
                                    onChange={handleInputChange}
                                />
                                Connect with Booking
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="location_type"
                                    value="external"
                                    checked={formData.location_type === 'external'}
                                    onChange={handleInputChange}
                                />
                                External Location
                            </label>
                        </div>
                    </div>                    {formData.location_type === 'booking' && (
                        <div className="form-group">
                            {pendingCount > 0 && (
                                <div className="warning-message">
                                    <p>
                                        You have {pendingCount} booking{pendingCount !== 1 ? 's' : ''} that {pendingCount !== 1 ? 'are' : 'is'} not completed (unpaid). 
                                        {' '}
                                        <button 
                                            type="button" 
                                            onClick={() => navigate('/my-activity')}
                                            className="link-btn"
                                        >
                                            Go to My Activity
                                        </button> to complete them.
                                    </p>
                                </div>
                            )}
                            {upcomingReservations.length === 0 ? (
                                <div className="info-message">
                                    <p>You don't have any upcoming confirmed bookings.</p>
                                    <p>
                                        <button 
                                            type="button" 
                                            onClick={() => navigate('/my-activity')}
                                            className="link-btn"
                                        >
                                            Go to My Activity
                                        </button> to view your bookings or use an external location.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <label htmlFor="related_booking_id">Select Your Booking *</label>
                                    <select
                                        id="related_booking_id"
                                        name="related_booking_id"
                                        value={formData.related_booking_id}
                                        onChange={handleInputChange}
                                        required
                                        className="booking-select"
                                    >
                                        <option value="">Select a booking</option>
                                        {upcomingReservations.map(reservation => {
                                            const date = new Date(reservation.start_time).toLocaleDateString('en-US', { 
                                                weekday: 'short', 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            });
                                            const startTime = new Date(reservation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const endTime = new Date(reservation.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const location = reservation.complex_name || reservation.facility_name;
                                            
                                            return (
                                                <option 
                                                    key={reservation.id} 
                                                    value={reservation.id}
                                                    title={`${reservation.facility_sport} at ${location}, ${reservation.facility_city} - €${reservation.total_price.toFixed(2)}`}
                                                >
                                                    {date} • {startTime}-{endTime} • {reservation.facility_sport} @ {location}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    
                                    {selectedReservation && (
                                        <div className="selected-booking-details">
                                            <div className="details-header">
                                                <h4>Selected Booking Details</h4>
                                                <button 
                                                    type="button" 
                                                    onClick={handleDeselectBooking}
                                                    className="deselect-btn"
                                                    title="Deselect booking"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="details-content">
                                                <div className="detail-row">
                                                    <span className="detail-label">Sport:</span>
                                                    <span className="detail-value">{selectedReservation.facility_sport}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Facility:</span>
                                                    <span className="detail-value">
                                                        {selectedReservation.complex_name || selectedReservation.facility_name}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Location:</span>
                                                    <span className="detail-value">
                                                        {selectedReservation.facility_address}, {selectedReservation.facility_city}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Date & Time:</span>
                                                    <span className="detail-value">
                                                        {new Date(selectedReservation.start_time).toLocaleDateString('en-US', { 
                                                            weekday: 'long', 
                                                            year: 'numeric', 
                                                            month: 'long', 
                                                            day: 'numeric' 
                                                        })}
                                                        <br />
                                                        {new Date(selectedReservation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedReservation.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>                                                {selectedReservation.status === 'pending' && (
                                                    <>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Price:</span>
                                                            <span className="detail-value price">€{selectedReservation.total_price.toFixed(2)}</span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <button 
                                                                type="button"
                                                                onClick={() => openPaymentModal(selectedReservation)}
                                                                className="pay-now-btn"
                                                            >
                                                                💳 Pay Now
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {formData.location_type === 'external' && (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="start_time">Start Time *</label>
                                    <input
                                        type="datetime-local"
                                        id="start_time"
                                        name="start_time"
                                        value={formData.start_time}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="end_time">End Time *</label>
                                    <input
                                        type="datetime-local"
                                        id="end_time"
                                        name="end_time"
                                        value={formData.end_time}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Address *</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Enter the event location"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate('/events')} className="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? 'Creating...' : 'Create Event'}
                        </button>                    </div>
                </form>

                {/* Payment Modal */}
                {paymentModalOpen && selectedReservationForPayment && (
                    <div className="modal-overlay" onClick={() => setPaymentModalOpen(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Complete Payment</h2>
                                <button 
                                    className="close-button" 
                                    onClick={() => setPaymentModalOpen(false)}
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="payment-summary">
                                    <h3>{selectedReservationForPayment.facility_name}</h3>
                                    <p className="payment-detail">
                                        📅 {new Date(selectedReservationForPayment.start_time).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                    <p className="payment-detail">
                                        🕐 {new Date(selectedReservationForPayment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedReservationForPayment.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <div className="payment-amount">
                                        <span>Total Amount:</span>
                                        <strong>€{selectedReservationForPayment.total_price.toFixed(2)}</strong>
                                    </div>
                                </div>

                                <div className="payment-methods">
                                    <h3>Select Payment Method</h3>
                                    <div className="payment-buttons">
                                        <button
                                            className="payment-method-btn"
                                            onClick={() => handlePayment('on_place')}
                                            disabled={processingPayment}
                                        >
                                            <div className="payment-icon">🏢</div>
                                            <div className="payment-text">
                                                <strong>Pay On Place</strong>
                                                <small>Pay at the facility</small>
                                            </div>
                                        </button>
                                        <button
                                            className="payment-method-btn"
                                            onClick={() => handlePayment('card')}
                                            disabled={processingPayment}
                                        >
                                            <div className="payment-icon">💳</div>
                                            <div className="payment-text">
                                                <strong>Pay With Card</strong>
                                                <small>Secure online payment</small>
                                            </div>
                                        </button>
                                    </div>
                                    {processingPayment && (
                                        <div className="processing-message">
                                            Processing payment...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
