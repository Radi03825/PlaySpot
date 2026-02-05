import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event, Sport } from '../types';
import { eventService, metadataService } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/Events.css';

export default function Events() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filters
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedSport, setSelectedSport] = useState<number | undefined>();

    useEffect(() => {
        fetchSports();
        fetchEvents();
    }, [selectedStatus, selectedSport]);    const fetchSports = async () => {
        try {
            const data = await metadataService.getSports();
            setSports(data);
        } catch (err) {
            console.error('Failed to fetch sports:', err);
        }
    };

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await eventService.getAll(selectedStatus || undefined, selectedSport);
            setEvents(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (eventId: number) => {
        navigate(`/events/${eventId}`);
    };

    const handleCreateEvent = () => {
        navigate('/events/create');
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="events-page">
                <div className="loading">Loading events...</div>
            </div>
        );
    }

    return (
        <div className="events-page">
            <div className="events-header">
                <h1>Sport Events</h1>
                {user && (
                    <button className="create-event-btn" onClick={handleCreateEvent}>
                        + Create Event
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="events-filters">
                <div className="filter-group">
                    <label htmlFor="status-filter">Status:</label>
                    <select
                        id="status-filter"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="UPCOMING">Upcoming</option>
                        <option value="FULL">Full</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELED">Canceled</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="sport-filter">Sport:</label>
                    <select
                        id="sport-filter"
                        value={selectedSport || ''}
                        onChange={(e) => setSelectedSport(e.target.value ? Number(e.target.value) : undefined)}
                    >
                        <option value="">All Sports</option>
                        {sports.map(sport => (
                            <option key={sport.id} value={sport.id}>
                                {sport.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="error-message">{error}</div>
            )}

            {/* Events List */}
            <div className="events-list">
                {events.length === 0 ? (
                    <div className="no-events">
                        <p>No events found.</p>
                        {user && (
                            <button onClick={handleCreateEvent}>Create the first event!</button>
                        )}
                    </div>
                ) : (
                    events.map(event => (
                        <div
                            key={event.id}
                            className="event-card"
                            onClick={() => handleEventClick(event.id)}
                        >
                            <div className="event-card-header">
                                <h3>{event.title}</h3>
                                <span className={getStatusBadgeClass(event.status)}>
                                    {event.status}
                                </span>
                            </div>

                            <div className="event-card-body">
                                <div className="event-info">
                                    <div className="info-item">
                                        <span className="icon">🏅</span>
                                        <span>{event.sport?.name || 'Sport'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="icon">📅</span>
                                        <span>{formatDate(event.start_time)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="icon">⏰</span>
                                        <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="icon">📍</span>
                                        <span>
                                            {event.facility?.name || event.address || 'Location TBD'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="icon">👤</span>
                                        <span>Organizer: {event.organizer?.name || 'Unknown'}</span>
                                    </div>
                                </div>

                                <div className="event-participants">
                                    <div className="participants-count">
                                        <span className="count">{event.current_participants} / {event.max_participants}</span>
                                        <span className="label">Participants</span>
                                    </div>
                                    {event.is_user_joined && (
                                        <div className="joined-badge">✓ Joined</div>
                                    )}
                                </div>

                                {event.description && (
                                    <p className="event-description">{event.description}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
