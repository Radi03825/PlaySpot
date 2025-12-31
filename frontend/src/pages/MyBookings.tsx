import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/MyBookings.css";

interface Reservation {
    id: number;
    facility_id: number;
    start_time: string;
    end_time: string;
    status: string;
    total_price: number;
    created_at: string;
    facility_name?: string;
    facility_category?: string;
}

export default function MyBookings() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('upcoming');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchReservations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
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

            // Handle empty or null data
            if (!data || !Array.isArray(data) || data.length === 0) {
                setReservations([]);
                return;
            }

            // Fetch facility details for each reservation
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
            setLoading(false);
        }
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

            // Refresh reservations
            await fetchReservations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel reservation');
        } finally {
            setCancellingId(null);
        }
    };

    const handleViewFacility = (facilityId: number) => {
        navigate(`/facilities/${facilityId}`);
    };

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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

            switch (filter) {
                case 'upcoming':
                    return startTime > now && reservation.status !== 'cancelled';
                case 'past':
                    return startTime <= now && reservation.status !== 'cancelled';
                case 'cancelled':
                    return reservation.status === 'cancelled';
                case 'all':
                default:
                    return true;
            }
        }).sort((a, b) => {
            // Sort by start time, most recent first
            return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
        });
    };

    const filteredReservations = getFilteredReservations();

    if (!user) {
        return null;
    }

    return (
        <div className="my-bookings-page">
            <div className="container">
                <div className="page-header">
                    <h1>My Bookings</h1>
                    <p>View and manage your facility reservations</p>
                </div>

                {error && (
                    <div className="error-banner">
                        <span>{error}</span>
                        <button onClick={() => setError("")}>&times;</button>
                    </div>
                )}

                <div className="bookings-filters">
                    <button
                        className={filter === 'upcoming' ? 'active' : ''}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={filter === 'past' ? 'active' : ''}
                        onClick={() => setFilter('past')}
                    >
                        Past
                    </button>
                    <button
                        className={filter === 'cancelled' ? 'active' : ''}
                        onClick={() => setFilter('cancelled')}
                    >
                        Cancelled
                    </button>
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading your bookings...</p>
                    </div>
                ) : filteredReservations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📅</div>
                        <h2>No bookings found</h2>
                        <p>
                            {filter === 'upcoming' && "You don't have any upcoming reservations."}
                            {filter === 'past' && "You don't have any past reservations."}
                            {filter === 'cancelled' && "You don't have any cancelled reservations."}
                            {filter === 'all' && "You haven't made any reservations yet."}
                        </p>
                        <button className="btn-primary" onClick={() => navigate('/facilities')}>
                            Browse Facilities
                        </button>
                    </div>
                ) : (
                    <div className="bookings-list">
                        {filteredReservations.map((reservation) => {
                            const isPast = new Date(reservation.start_time) <= new Date();
                            const isCancelled = reservation.status === 'cancelled';
                            const canCancel = !isPast && !isCancelled;

                            return (
                                <div
                                    key={reservation.id}
                                    className={`booking-card ${isCancelled ? 'cancelled' : ''} ${isPast ? 'past' : ''}`}
                                >
                                    <div className="booking-header">
                                        <div className="facility-info">
                                            <h3>{reservation.facility_name || `Facility #${reservation.facility_id}`}</h3>
                                            {reservation.facility_category && (
                                                <span className="category-badge">{reservation.facility_category}</span>
                                            )}
                                        </div>
                                        <div className="booking-status">
                                            <span className={`status-badge ${reservation.status}`}>
                                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="booking-details">
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

                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <span className="detail-label">📝 Booked On</span>
                                                <span className="detail-value">{formatDateTime(reservation.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="booking-actions">
                                        <button
                                            className="btn-secondary"
                                            onClick={() => handleViewFacility(reservation.facility_id)}
                                        >
                                            View Facility
                                        </button>
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
                )}
            </div>
        </div>
    );
}

