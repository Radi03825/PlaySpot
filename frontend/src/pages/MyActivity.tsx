import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Event } from "../types";
import type { Reservation } from "../types";
import "../styles/MyActivity.css";

type TabType = 'bookings' | 'myEvents' | 'joinedEvents';
type StatusFilter = 'upcoming' | 'completed' | 'cancelled' | 'all';

interface ReservationWithDetails extends Reservation {
    facility_name?: string;
    facility_category?: string;
}

export default function MyActivity() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('bookings');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('upcoming');
    
    // Bookings state
    const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
    const [loadingReservations, setLoadingReservations] = useState(true);
    
    // My Events state
    const [myEvents, setMyEvents] = useState<Event[]>([]);
    const [loadingMyEvents, setLoadingMyEvents] = useState(true);
    
    // Joined Events state
    const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
    const [loadingJoinedEvents, setLoadingJoinedEvents] = useState(true);
    
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [showNewBookingMessage, setShowNewBookingMessage] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        // Check if coming from a new booking
        const params = new URLSearchParams(window.location.search);
        if (params.get('new') === 'true') {
            setShowNewBookingMessage(true);
            window.history.replaceState({}, '', '/my-activity');
            setTimeout(() => setShowNewBookingMessage(false), 5000);
        }
        
        fetchReservations();
        fetchMyEvents();
        fetchJoinedEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchReservations = async () => {
        try {
            setLoadingReservations(true);
            setError("");

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch('http://localhost:8081/api/reservations/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch reservations');
            }

            const data = await response.json();

            if (!data || !Array.isArray(data) || data.length === 0) {
                setReservations([]);
                return;
            }

            const reservationsWithDetails = await Promise.all(
                data.map(async (reservation: Reservation) => {
                    try {
                        const facilityResponse = await fetch(
                            `http://localhost:8081/api/facilities/${reservation.facility_id}`
                        );
                        if (facilityResponse.ok) {
                            const facility = await facilityResponse.json();
                            return {
                                ...reservation,
                                facility_name: facility.name,
                                facility_category: facility.category_name,
                            };
                        }
                    } catch (err) {
                        console.error('Error fetching facility details:', err);
                    }
                    return reservation;
                })
            );

            setReservations(reservationsWithDetails);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load reservations');
        } finally {
            setLoadingReservations(false);
        }
    };

    const fetchMyEvents = async () => {
        try {
            setLoadingMyEvents(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch('http://localhost:8081/api/users/me/events', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch your events');
            }

            const data = await response.json();
            setMyEvents(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load your events');
        } finally {
            setLoadingMyEvents(false);
        }
    };

    const fetchJoinedEvents = async () => {
        try {
            setLoadingJoinedEvents(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch('http://localhost:8081/api/users/me/events/joined', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch joined events');
            }

            const data = await response.json();
            setJoinedEvents(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load joined events');
        } finally {
            setLoadingJoinedEvents(false);
        }
    };

    const handlePayment = async (paymentMethod: 'on_place' | 'card') => {
        if (!selectedReservation) return;

        try {
            setProcessingPayment(true);
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:8081/api/reservations/${selectedReservation.id}/pay`, {
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

            await fetchReservations();
            setPaymentModalOpen(false);
            setSelectedReservation(null);
            alert('Payment successful! Check your email for confirmation.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process payment');
        } finally {
            setProcessingPayment(false);
        }
    };

    const openPaymentModal = (reservation: ReservationWithDetails) => {
        setSelectedReservation(reservation);
        setPaymentModalOpen(true);
    };

    const handleCancelReservation = async (reservationId: number) => {
        if (!window.confirm('Are you sure you want to cancel this reservation?')) {
            return;
        }

        try {
            setCancellingId(reservationId);
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:8081/api/reservations/${reservationId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to cancel reservation');
            }

            await fetchReservations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel reservation');
        } finally {
            setCancellingId(null);
        }
    };

    const handleLeaveEvent = async (eventId: number) => {
        if (!window.confirm('Are you sure you want to leave this event?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:8081/api/events/${eventId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to leave event');
            }

            await fetchJoinedEvents();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to leave event');
        }
    };

    const handleCancelEvent = async (eventId: number) => {
        if (!window.confirm('Are you sure you want to cancel this event? All participants will be notified.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:8081/api/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'CANCELED' }),
            });

            if (!response.ok) {
                throw new Error('Failed to cancel event');
            }

            await fetchMyEvents();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel event');        }
    };

    const formatDate = (dateTime: string) => {
        const date = new Date(dateTime);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (dateTime: string) => {
        const date = new Date(dateTime);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const calculateDuration = (startTime: string, endTime: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return hours;
    };

    const getFilteredReservations = () => {
        const now = new Date();
        return reservations.filter(reservation => {
            const startTime = new Date(reservation.start_time);
            switch (statusFilter) {
                case 'upcoming':
                    return startTime > now && reservation.status !== 'cancelled';
                case 'completed':
                    return startTime <= now && reservation.status !== 'cancelled';
                case 'cancelled':
                    return reservation.status === 'cancelled';
                case 'all':
                default:
                    return true;
            }
        }).sort((a, b) => {
            if (statusFilter === 'upcoming') {
                return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
            } else {
                return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
            }
        });
    };    const getFilteredEvents = (events: Event[]) => {
        return events.filter(event => {
            switch (statusFilter) {
                case 'upcoming':
                    return event.status === 'UPCOMING' || event.status === 'FULL';
                case 'completed':
                    return event.status === 'COMPLETED';
                case 'cancelled':
                    return event.status === 'CANCELED';
                case 'all':
                default:
                    return true;
            }
        }).sort((a, b) => {
            if (statusFilter === 'upcoming') {
                return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
            } else {
                return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
            }
        });
    };

    const renderBookings = () => {
        const filteredReservations = getFilteredReservations();

        if (loadingReservations) {
            return (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your bookings...</p>
                </div>
            );
        }

        if (filteredReservations.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h2>No bookings found</h2>
                    <p>
                        {statusFilter === 'upcoming' && "You don't have any upcoming reservations."}
                        {statusFilter === 'completed' && "You don't have any completed reservations."}
                        {statusFilter === 'cancelled' && "You don't have any cancelled reservations."}
                        {statusFilter === 'all' && "You haven't made any reservations yet."}
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/facilities')}>
                        Browse Facilities
                    </button>
                </div>
            );
        }

        return (
            <div className="activity-list">
                {filteredReservations.map((reservation) => {
                    const isPast = new Date(reservation.start_time) <= new Date();
                    const isCancelled = reservation.status === 'cancelled';
                    const isPending = reservation.status === 'pending';
                    const canCancel = !isPast && !isCancelled;
                    const canPay = isPending && !isPast && !isCancelled;

                    return (
                        <div
                            key={reservation.id}
                            className={`activity-card ${isCancelled ? 'cancelled' : ''} ${isPast ? 'past' : ''}`}
                        >
                            <div className="activity-header">
                                <div className="activity-info">
                                    <h3>{reservation.facility_name || `Facility #${reservation.facility_id}`}</h3>
                                    {reservation.facility_category && (
                                        <span className="category-badge">{reservation.facility_category}</span>
                                    )}
                                </div>
                                <div className="activity-status">
                                    <span className={`status-badge ${reservation.status}`}>
                                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="activity-details">
                                <div className="detail-row">
                                    <div className="detail-item">
                                        <span className="detail-label">📅 Date</span>
                                        <span className="detail-value">{formatDate(reservation.start_time)}</span>
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-item">
                                        <span className="detail-label">🕐 Start Time</span>
                                        <span className="detail-value">{formatTime(reservation.start_time)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">🕐 End Time</span>
                                        <span className="detail-value">{formatTime(reservation.end_time)}</span>
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-item">
                                        <span className="detail-label">⏱️ Duration</span>
                                        <span className="detail-value">
                                            {calculateDuration(reservation.start_time, reservation.end_time)} hour(s)
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">💰 Total Price</span>
                                        <span className="detail-value price">€{reservation.total_price.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="activity-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate(`/facilities/${reservation.facility_id}`)}
                                >
                                    View Facility
                                </button>
                                {canPay && (
                                    <button
                                        className="btn-primary"
                                        onClick={() => openPaymentModal(reservation)}
                                    >
                                        Pay Now
                                    </button>
                                )}
                                {canCancel && (
                                    <button
                                        className="btn-danger"
                                        onClick={() => handleCancelReservation(reservation.id)}
                                        disabled={cancellingId === reservation.id}
                                    >
                                        {cancellingId === reservation.id ? 'Cancelling...' : 'Cancel Booking'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderMyEvents = () => {
        const filteredEvents = getFilteredEvents(myEvents);

        if (loadingMyEvents) {
            return (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your events...</p>
                </div>
            );
        }

        if (filteredEvents.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">🎯</div>
                    <h2>No events found</h2>
                    <p>
                        {statusFilter === 'upcoming' && "You haven't created any upcoming events."}
                        {statusFilter === 'completed' && "You don't have any completed events."}
                        {statusFilter === 'cancelled' && "You don't have any cancelled events."}
                        {statusFilter === 'all' && "You haven't created any events yet."}
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/events/create')}>
                        Create Event
                    </button>
                </div>
            );
        }

        return (
            <div className="activity-list">
                {filteredEvents.map((event) => (
                    <div key={event.id} className={`activity-card event-card ${event.status.toLowerCase()}`}>
                        <div className="activity-header">
                            <div className="activity-info">
                                <h3>{event.title}</h3>
                                {event.sport && (
                                    <span className="sport-badge">{event.sport.name}</span>
                                )}
                            </div>
                            <div className="activity-status">
                                <span className={`status-badge ${event.status.toLowerCase()}`}>
                                    {event.status}
                                </span>
                            </div>
                        </div>

                        {event.description && (
                            <p className="event-description">{event.description}</p>
                        )}

                        <div className="activity-details">
                            <div className="detail-row">
                                <div className="detail-item">
                                    <span className="detail-label">📅 Date</span>
                                    <span className="detail-value">{formatDate(event.start_time)}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item">
                                    <span className="detail-label">🕐 Time</span>
                                    <span className="detail-value">
                                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                    </span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item">
                                    <span className="detail-label">👥 Participants</span>
                                    <span className="detail-value">
                                        {event.current_participants} / {event.max_participants}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">📍 Location</span>
                                    <span className="detail-value">
                                        {event.facility?.name || event.address || 'TBD'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="activity-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => navigate(`/events/${event.id}`)}
                            >
                                View Details
                            </button>
                            {event.status === 'UPCOMING' && (
                                <>
                                    <button
                                        className="btn-primary"
                                        onClick={() => navigate(`/events/${event.id}/edit`)}
                                    >
                                        Edit Event
                                    </button>
                                    <button
                                        className="btn-danger"
                                        onClick={() => handleCancelEvent(event.id)}
                                    >
                                        Cancel Event
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderJoinedEvents = () => {
        const filteredEvents = getFilteredEvents(joinedEvents);

        if (loadingJoinedEvents) {
            return (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading joined events...</p>
                </div>
            );
        }

        if (filteredEvents.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">🤝</div>
                    <h2>No events found</h2>
                    <p>
                        {statusFilter === 'upcoming' && "You haven't joined any upcoming events."}
                        {statusFilter === 'completed' && "You don't have any completed events."}
                        {statusFilter === 'cancelled' && "You don't have any cancelled events."}
                        {statusFilter === 'all' && "You haven't joined any events yet."}
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/events')}>
                        Browse Events
                    </button>
                </div>
            );
        }

        return (
            <div className="activity-list">
                {filteredEvents.map((event) => (
                    <div key={event.id} className={`activity-card event-card ${event.status.toLowerCase()}`}>
                        <div className="activity-header">
                            <div className="activity-info">
                                <h3>{event.title}</h3>
                                {event.sport && (
                                    <span className="sport-badge">{event.sport.name}</span>
                                )}
                            </div>
                            <div className="activity-status">
                                <span className={`status-badge ${event.status.toLowerCase()}`}>
                                    {event.status}
                                </span>
                            </div>
                        </div>

                        {event.description && (
                            <p className="event-description">{event.description}</p>
                        )}

                        <div className="activity-details">
                            <div className="detail-row">
                                <div className="detail-item">
                                    <span className="detail-label">👤 Organizer</span>
                                    <span className="detail-value">
                                        {event.organizer?.name || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item">
                                    <span className="detail-label">📅 Date</span>
                                    <span className="detail-value">{formatDate(event.start_time)}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item">
                                    <span className="detail-label">🕐 Time</span>
                                    <span className="detail-value">
                                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                    </span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item">
                                    <span className="detail-label">👥 Participants</span>
                                    <span className="detail-value">
                                        {event.current_participants} / {event.max_participants}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">📍 Location</span>
                                    <span className="detail-value">
                                        {event.facility?.name || event.address || 'TBD'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="activity-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => navigate(`/events/${event.id}`)}
                            >
                                View Details
                            </button>
                            {(event.status === 'UPCOMING' || event.status === 'FULL') && (
                                <button
                                    className="btn-danger"
                                    onClick={() => handleLeaveEvent(event.id)}
                                >
                                    Leave Event
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };    if (!user) {
        return null;
    }

    return (
        <div className="my-activity-page">
            <div className="container">
                <div className="page-header">
                    <h1>My Activity</h1>
                    <p>Manage your bookings and events</p>
                </div>

                {error && (
                    <div className="error-banner">
                        <span>{error}</span>
                        <button onClick={() => setError("")}>&times;</button>
                    </div>
                )}

                {showNewBookingMessage && (
                    <div className="success-banner">
                        <span>✅ Booking created successfully! Please complete payment to confirm your reservation.</span>
                        <button onClick={() => setShowNewBookingMessage(false)}>&times;</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="activity-tabs">
                    <button
                        className={activeTab === 'bookings' ? 'active' : ''}
                        onClick={() => setActiveTab('bookings')}
                    >
                        <span className="tab-icon">📅</span>
                        <span className="tab-label">My Bookings</span>
                        {!loadingReservations && (
                            <span className="tab-count">{reservations.length}</span>
                        )}
                    </button>
                    <button
                        className={activeTab === 'myEvents' ? 'active' : ''}
                        onClick={() => setActiveTab('myEvents')}
                    >
                        <span className="tab-icon">🎯</span>
                        <span className="tab-label">My Events</span>
                        {!loadingMyEvents && (
                            <span className="tab-count">{myEvents.length}</span>
                        )}
                    </button>
                    <button
                        className={activeTab === 'joinedEvents' ? 'active' : ''}
                        onClick={() => setActiveTab('joinedEvents')}
                    >
                        <span className="tab-icon">🤝</span>
                        <span className="tab-label">Events I Joined</span>
                        {!loadingJoinedEvents && (
                            <span className="tab-count">{joinedEvents.length}</span>
                        )}
                    </button>
                </div>

                {/* Status Filters */}
                <div className="status-filters">
                    <button
                        className={statusFilter === 'upcoming' ? 'active' : ''}
                        onClick={() => setStatusFilter('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={statusFilter === 'completed' ? 'active' : ''}
                        onClick={() => setStatusFilter('completed')}
                    >
                        Completed
                    </button>
                    <button
                        className={statusFilter === 'cancelled' ? 'active' : ''}
                        onClick={() => setStatusFilter('cancelled')}
                    >
                        Cancelled
                    </button>
                    <button
                        className={statusFilter === 'all' ? 'active' : ''}
                        onClick={() => setStatusFilter('all')}
                    >
                        All
                    </button>
                </div>

                {/* Content */}
                <div className="tab-content">
                    {activeTab === 'bookings' && renderBookings()}
                    {activeTab === 'myEvents' && renderMyEvents()}
                    {activeTab === 'joinedEvents' && renderJoinedEvents()}
                </div>

                {/* Payment Modal */}
                {paymentModalOpen && selectedReservation && (
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
                                    <h3>{selectedReservation.facility_name}</h3>
                                    <p className="payment-detail">
                                        📅 {formatDate(selectedReservation.start_time)}
                                    </p>
                                    <p className="payment-detail">
                                        🕐 {formatTime(selectedReservation.start_time)} - {formatTime(selectedReservation.end_time)}
                                    </p>
                                    <div className="payment-amount">
                                        <span>Total Amount:</span>
                                        <strong>€{selectedReservation.total_price.toFixed(2)}</strong>
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
