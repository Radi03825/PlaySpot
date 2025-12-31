import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import { changePassword, connectGoogleCalendar } from "../services/api";
import { useGoogleLogin } from '@react-oauth/google';
import "../styles/Profile.css";

// Function to calculate age in years, months, and days
function calculateAge(birthDateString: string): string {
    const birthDate = new Date(birthDateString);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Adjust if days are negative
    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }

    // Adjust if months are negative
    if (months < 0) {
        years--;
        months += 12;
    }

    return `${years} years, ${months} months and ${days} days`;
}

export default function Profile() {
    const { user } = useAuth();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [calendarConnected, setCalendarConnected] = useState(false);
    const [calendarError, setCalendarError] = useState("");
    const [calendarSuccess, setCalendarSuccess] = useState("");
    const [connectingCalendar, setConnectingCalendar] = useState(false);

    // Check if calendar is already connected
    useEffect(() => {
        const hasCalendar = localStorage.getItem('has_calendar_access') === 'true';
        setCalendarConnected(hasCalendar);
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await changePassword(oldPassword, newPassword);
            setSuccess("Password changed successfully!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    const handleCalendarConnect = async (codeResponse: { code?: string }) => {
        if (!codeResponse.code) {
            setCalendarError("Failed to get Google authorization");
            return;
        }

        setConnectingCalendar(true);
        setCalendarError("");
        setCalendarSuccess("");

        try {
            await connectGoogleCalendar(codeResponse.code);
            setCalendarConnected(true);
            localStorage.setItem('has_calendar_access', 'true');
            setCalendarSuccess("✅ Google Calendar connected! Your future bookings will sync to your calendar.");
        } catch (err) {
            setCalendarError(err instanceof Error ? err.message : "Failed to connect Google Calendar");
        } finally {
            setConnectingCalendar(false);
        }
    };

    const googleCalendarLogin = useGoogleLogin({
        onSuccess: handleCalendarConnect,
        onError: () => setCalendarError("Failed to connect Google Calendar"),
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/calendar.events',
    });

    const handleDisconnectCalendar = () => {
        setCalendarConnected(false);
        localStorage.setItem('has_calendar_access', 'false');
        setCalendarSuccess("Google Calendar disconnected");
    };

    return (
        <div className="profile-container">
            <h1>User Profile</h1>

            {/* User Information Card */}
            <div className="profile-card">
                <h2>Personal Information</h2>
                <div className="profile-info">
                    <div className="profile-field">
                        <strong>Name:</strong>
                        <span>{user?.name}</span>
                    </div>
                    <div className="profile-field">
                        <strong>Email:</strong>
                        <span>{user?.email}</span>
                    </div>
                    <div className="profile-field">
                        <strong>Age:</strong>
                        <span>
                            {user?.birth_date && calculateAge(user?.birth_date)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Google Calendar Integration Card */}
            <div className="profile-card">
                <h2>Google Calendar Integration</h2>

                {calendarError && <div className="error-message">{calendarError}</div>}
                {calendarSuccess && <div className="success-message">{calendarSuccess}</div>}

                <div className="calendar-integration">
                    {calendarConnected ? (
                        <>
                            <div className="calendar-status connected">
                                <span className="status-icon">✓</span>
                                <span>Google Calendar Connected</span>
                            </div>
                            <p className="calendar-info">
                                Your bookings will automatically sync to your Google Calendar.
                            </p>
                            <button
                                onClick={handleDisconnectCalendar}
                                className="disconnect-button"
                            >
                                Disconnect Calendar
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="calendar-status disconnected">
                                <span className="status-icon">○</span>
                                <span>Google Calendar Not Connected</span>
                            </div>
                            <p className="calendar-info">
                                Connect your Google Calendar to automatically add your bookings to your calendar with reminders.
                            </p>
                            <button
                                onClick={() => googleCalendarLogin()}
                                disabled={connectingCalendar}
                                className="connect-calendar-button"
                            >
                                {connectingCalendar ? "Connecting..." : "Connect Google Calendar"}
                            </button>
                            <div className="profile-note" style={{marginTop: '1rem', fontSize: '0.9rem'}}>
                                <strong>Note:</strong> If you see "Access blocked" error, you need to be added as a test user in Google Cloud Console.
                                Contact the administrator or check the documentation for setup instructions.
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Change Password Card */}
            <div className="profile-card">
                <h2>Change Password</h2>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleChangePassword} className="change-password-form">
                    <div className="form-group">
                        <label htmlFor="oldPassword">Current Password</label>
                        <PasswordInput
                            value={oldPassword}
                            onChange={setOldPassword}
                            placeholder="Enter current password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <PasswordInput
                            value={newPassword}
                            onChange={setNewPassword}
                            placeholder="Enter new password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <PasswordInput
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Confirm new password"
                            required
                        />
                    </div>

                    <button type="submit" className="change-password-button" disabled={loading}>
                        {loading ? "Changing..." : "Change Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
