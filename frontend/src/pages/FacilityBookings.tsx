import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reservationService } from '../api/service/reservation.service';
import type { ReservationWithFacility } from '../types';
import '../styles/FacilityBookings.css';

const FacilityBookings = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<ReservationWithFacility[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [facilityName, setFacilityName] = useState<string>('');

    // Initialize with current month
    useEffect(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${year}-${month}`);
    }, []);

    // Fetch bookings when month or facility changes
    useEffect(() => {
        if (!id || !selectedMonth) return;

        const fetchBookings = async () => {
            try {
                setLoading(true);
                setError(null);

                const [year, month] = selectedMonth.split('-');
                const startDate = `${year}-${month}-01`;
                
                // Calculate end date (first day of next month)
                const nextMonth = new Date(parseInt(year), parseInt(month), 1);
                const endYear = nextMonth.getFullYear();
                const endMonth = String(nextMonth.getMonth() + 1).padStart(2, '0');
                const endDate = `${endYear}-${endMonth}-01`;                
                const data = await reservationService.getFacilityBookings(
                    parseInt(id),
                    startDate,
                    endDate
                );

                setBookings(data || []);
                
                // Get facility name from first booking if available
                if (data && data.length > 0 && data[0].facility_name) {
                    setFacilityName(data[0].facility_name);
                }
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch bookings');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [id, selectedMonth]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusClass = (status: string) => {
        return `status-badge status-${status.toLowerCase()}`;
    };

    const getMonthName = (monthString: string) => {
        const [year, month] = monthString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    if (loading) {
        return (
            <div className="facility-bookings">
                <div className="loading">Loading bookings...</div>
            </div>
        );
    }

    return (
        <div className="facility-bookings">
            <div className="bookings-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h1>Facility Bookings</h1>
                {facilityName && <h2>{facilityName}</h2>}
            </div>

            <div className="month-selector">
                <label htmlFor="month">Select Month:</label>
                <input
                    type="month"
                    id="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                />
                <span className="selected-month-label">
                    {getMonthName(selectedMonth)}
                </span>
            </div>            {error && <div className="error-message">{error}</div>}

            {!bookings || bookings.length === 0 ? (
                <div className="no-bookings">
                    <p>No bookings found for {getMonthName(selectedMonth)}</p>
                </div>
            ) : (
                <div className="bookings-table-container">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>User</th>
                                <th>Email</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Total Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td>#{booking.id}</td>
                                    <td>{booking.user_name || 'N/A'}</td>
                                    <td>{booking.user_email || 'N/A'}</td>
                                    <td>{formatDate(booking.start_time)}</td>
                                    <td>
                                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                    </td>
                                    <td>
                                        <span className={getStatusClass(booking.status)}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td>${booking.total_price.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}            {bookings && bookings.length > 0 && (
                <div className="bookings-summary">
                    <p>
                        Total Bookings: <strong>{bookings.length}</strong>
                    </p>
                    <p>
                        Total Revenue: <strong>
                            ${bookings
                                .filter(b => b.status !== 'cancelled')
                                .reduce((sum, b) => sum + b.total_price, 0)
                                .toFixed(2)}
                        </strong>
                    </p>
                </div>
            )}
        </div>
    );
};

export default FacilityBookings;
