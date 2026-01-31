import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Sport, Event } from '../types';
import { updateEvent, getEventById, getSports } from '../services/api';
import '../styles/CreateEventForm.css';

export default function EditEventForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sports, setSports] = useState<Sport[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [event, setEvent] = useState<Event | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        sport_id: '',
        start_time: '',
        end_time: '',
        max_participants: '',
        status: '',
        address: ''
    });

    useEffect(() => {
        fetchSports();
        if (id) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        try {
            setFetchLoading(true);
            const data = await getEventById(Number(id));
            setEvent(data);
            
            // Populate form with existing data
            setFormData({
                title: data.title,
                description: data.description || '',
                sport_id: data.sport_id.toString(),
                start_time: new Date(data.start_time).toISOString().slice(0, 16),
                end_time: new Date(data.end_time).toISOString().slice(0, 16),
                max_participants: data.max_participants.toString(),
                status: data.status,
                address: data.address || ''
            });
        } catch (err: any) {
            setError(err.message || 'Failed to load event');
        } finally {
            setFetchLoading(false);
        }
    };

    const fetchSports = async () => {
        try {
            const data = await getSports();
            setSports(data);
        } catch (err) {
            console.error('Failed to fetch sports:', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.title) {
            setError('Title is required');
            return;
        }

        try {
            setLoading(true);
            const updateData: any = {};

            // Only include changed fields
            if (formData.title !== event?.title) {
                updateData.title = formData.title;
            }
            if (formData.description !== (event?.description || '')) {
                updateData.description = formData.description || undefined;
            }
            if (Number(formData.sport_id) !== event?.sport_id) {
                updateData.sport_id = Number(formData.sport_id);
            }
            if (formData.start_time && new Date(formData.start_time).toISOString() !== event?.start_time) {
                updateData.start_time = new Date(formData.start_time).toISOString();
            }
            if (formData.end_time && new Date(formData.end_time).toISOString() !== event?.end_time) {
                updateData.end_time = new Date(formData.end_time).toISOString();
            }
            if (Number(formData.max_participants) !== event?.max_participants) {
                updateData.max_participants = Number(formData.max_participants);
            }
            if (formData.status !== event?.status) {
                updateData.status = formData.status;
            }
            if (formData.address !== (event?.address || '')) {
                updateData.address = formData.address || undefined;
            }

            await updateEvent(Number(id), updateData);
            navigate(`/events/${id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to update event');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="create-event-page">
                <div className="loading">Loading event...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="create-event-page">
                <div className="error-message">Event not found</div>
            </div>
        );
    }

    return (
        <div className="create-event-page">
            <div className="create-event-container">
                <h1>Edit Event</h1>

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
                            rows={4}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="sport_id">Sport *</label>
                            <select
                                id="sport_id"
                                name="sport_id"
                                value={formData.sport_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select a sport</option>
                                {sports.map(sport => (
                                    <option key={sport.id} value={sport.id}>
                                        {sport.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="max_participants">Max Participants *</label>
                            <input
                                type="number"
                                id="max_participants"
                                name="max_participants"
                                value={formData.max_participants}
                                onChange={handleInputChange}
                                min="2"
                                required
                            />
                        </div>
                    </div>

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
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                        >
                            <option value="UPCOMING">Upcoming</option>
                            <option value="FULL">Full</option>
                            <option value="CANCELED">Canceled</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    {!event.facility_id && (
                        <div className="form-group">
                            <label htmlFor="address">Address</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Event location"
                            />
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate(`/events/${id}`)} className="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? 'Updating...' : 'Update Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
