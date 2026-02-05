import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Event, EventParticipant } from '../types';
import { eventService } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/EventDetails.css';

export default function EventDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [participants, setParticipants] = useState<EventParticipant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchEventDetails();
            fetchParticipants();
        }
    }, [id]);    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const data = await eventService.getById(Number(id));
            setEvent(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const fetchParticipants = async () => {
        try {
            const data = await eventService.getParticipants(Number(id));
            setParticipants(data || []);
        } catch (err) {
            console.error('Failed to fetch participants:', err);
        }
    };

    const handleJoinEvent = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            setActionLoading(true);
            await eventService.join(Number(id));
            await fetchEventDetails();
            await fetchParticipants();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to join event');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveEvent = async () => {
        try {
            setActionLoading(true);
            await eventService.leave(Number(id));
            await fetchEventDetails();
            await fetchParticipants();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to leave event');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditEvent = () => {
        navigate(`/events/${id}/edit`);
    };

    const handleDeleteEvent = async () => {
        if (!window.confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            setActionLoading(true);
            await eventService.delete(Number(id));
            navigate('/events');
        } catch (err: any) {
            setError(err.message || 'Failed to delete event');
            setActionLoading(false);
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'UPCOMING':
                return 'status-badge status-upcoming';
            case 'FULL':
                return 'status-badge status-full';
            case 'CANCELED':
                return 'status-badge status-canceled';
            case 'COMPLETED':
                return 'status-badge status-completed';
            default:
                return 'status-badge';
        }
    };

    const canJoin = event && user && !event.is_user_joined && event.status === 'UPCOMING';
    const canLeave = event && user && event.is_user_joined;
    const isOrganizer = event && user && event.organizer_id === user.id;

    if (loading) {
        return (
            <div className="event-details-page">
                <div className="loading">Loading event details...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="event-details-page">
                <div className="error-message">Event not found</div>
            </div>
        );
    }

    return (
        <div className="event-details-page">
            <div className="event-details-container">
                {/* Header */}
                <div className="event-header">
                    <div className="header-top">
                        <h1>{event.title}</h1>
                        <span className={getStatusBadgeClass(event.status)}>
                            {event.status}
                        </span>
                    </div>
                    {isOrganizer && (
                        <div className="organizer-actions">
                            <button onClick={handleEditEvent} className="edit-btn">
                                Edit Event
                            </button>
                            <button onClick={handleDeleteEvent} className="delete-btn" disabled={actionLoading}>
                                Delete Event
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                {/* Main Content */}
                <div className="event-content">
                    {/* Left Column - Event Details */}
                    <div className="event-info-section">
                        <div className="info-card">
                            <h2>Event Details</h2>
                            
                            {event.description && (
                                <div className="info-item">
                                    <h3>Description</h3>
                                    <p>{event.description}</p>
                                </div>
                            )}

                            <div className="info-item">
                                <h3>Sport</h3>
                                <p>🏅 {event.sport?.name || 'Not specified'}</p>
                            </div>

                            <div className="info-item">
                                <h3>When</h3>
                                <p>📅 {formatDateTime(event.start_time)}</p>
                                <p>⏰ Ends: {formatDateTime(event.end_time)}</p>
                            </div>

                            <div className="info-item">
                                <h3>Location</h3>
                                {event.facility ? (
                                    <div>
                                        <p>📍 {event.facility.name}</p>
                                        {event.facility.address && <p className="address">{event.facility.address}</p>}
                                    </div>
                                ) : event.address ? (
                                    <p>📍 {event.address}</p>
                                ) : (
                                    <p>📍 Location TBD</p>
                                )}
                            </div>

                            <div className="info-item">
                                <h3>Organizer</h3>
                                <p>👤 {event.organizer?.name || 'Unknown'}</p>
                                <p className="email">{event.organizer?.email}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {user && (
                            <div className="action-buttons">
                                {canJoin && (
                                    <button 
                                        onClick={handleJoinEvent} 
                                        className="join-btn"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Joining...' : 'Join Event'}
                                    </button>
                                )}
                                {canLeave && (
                                    <button 
                                        onClick={handleLeaveEvent} 
                                        className="leave-btn"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Leaving...' : 'Leave Event'}
                                    </button>
                                )}
                            </div>
                        )}

                        {!user && event.status === 'UPCOMING' && (
                            <div className="login-prompt">
                                <p>Please <a href="/login">login</a> to join this event</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Participants */}
                    <div className="participants-section">
                        <div className="participants-card">
                            <h2>Participants</h2>
                            <div className="participants-count-display">
                                <span className="count">{event.current_participants}</span>
                                <span className="separator">/</span>
                                <span className="max">{event.max_participants}</span>
                            </div>
                            <p className="spots-remaining">
                                {event.max_participants - event.current_participants} spots remaining
                            </p>

                            <div className="participants-list">
                                {participants.length === 0 ? (
                                    <p className="no-participants">No participants yet. Be the first to join!</p>
                                ) : (
                                    participants.map((participant, index) => (
                                        <div key={participant.id} className="participant-item">
                                            <span className="participant-number">{index + 1}.</span>
                                            <div className="participant-info">
                                                <span className="participant-name">{participant.user?.name}</span>
                                                {participant.user_id === event.organizer_id && (
                                                    <span className="organizer-badge">Organizer</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
