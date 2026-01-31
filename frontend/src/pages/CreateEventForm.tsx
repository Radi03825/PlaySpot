import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Sport, FacilityDetails } from '../types';
import { createEvent, getSports, getMyFacilities } from '../services/api';
import '../styles/CreateEventForm.css';

export default function CreateEventForm() {
    const navigate = useNavigate();
    const [sports, setSports] = useState<Sport[]>([]);
    const [facilities, setFacilities] = useState<FacilityDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        sport_id: '',
        start_time: '',
        end_time: '',
        max_participants: '10',
        location_type: 'external', // 'facility' or 'external'
        facility_id: '',
        address: ''
    });

    useEffect(() => {
        fetchSports();
        fetchMyFacilities();
    }, []);

    const fetchSports = async () => {
        try {
            const data = await getSports();
            setSports(data);
        } catch (err) {
            console.error('Failed to fetch sports:', err);
        }
    };

    const fetchMyFacilities = async () => {
        try {
            const data = await getMyFacilities();
            setFacilities(data || []);
        } catch (err) {
            console.error('Failed to fetch facilities:', err);
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

        // Validation
        if (!formData.title || !formData.sport_id || !formData.start_time || !formData.end_time) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.location_type === 'external' && !formData.address) {
            setError('Please provide an address for external location');
            return;
        }

        if (formData.location_type === 'facility' && !formData.facility_id) {
            setError('Please select a facility');
            return;
        }

        try {
            setLoading(true);
            const eventData: any = {
                title: formData.title,
                description: formData.description || undefined,
                sport_id: Number(formData.sport_id),
                start_time: new Date(formData.start_time).toISOString(),
                end_time: new Date(formData.end_time).toISOString(),
                max_participants: Number(formData.max_participants)
            };

            if (formData.location_type === 'facility') {
                eventData.facility_id = Number(formData.facility_id);
            } else {
                eventData.address = formData.address;
            }

            const result = await createEvent(eventData);
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
                        <label>Location Type *</label>
                        <div className="radio-group">
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
                            <label>
                                <input
                                    type="radio"
                                    name="location_type"
                                    value="facility"
                                    checked={formData.location_type === 'facility'}
                                    onChange={handleInputChange}
                                />
                                My Facility
                            </label>
                        </div>
                    </div>

                    {formData.location_type === 'external' && (
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
                    )}

                    {formData.location_type === 'facility' && (
                        <div className="form-group">
                            <label htmlFor="facility_id">Select Facility *</label>
                            <select
                                id="facility_id"
                                name="facility_id"
                                value={formData.facility_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select a facility</option>
                                {facilities.map(facility => (
                                    <option key={facility.id} value={facility.id}>
                                        {facility.name} - {facility.city}
                                    </option>
                                ))}
                            </select>
                            {facilities.length === 0 && (
                                <p className="info-text">
                                    You don't have any facilities yet. Create one first or use an external location.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate('/events')} className="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
