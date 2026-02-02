const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

export async function register(name: string, email: string, password: string, birthDate: string) {
    return fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, birth_date: birthDate }),
    });
}

export async function login(email: string, password: string) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({email, password}),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Login failed");
    }

    return data;
}

export async function googleLogin(idToken: string, code?: string, scope?: string) {
    const body: Record<string, string> = { id_token: idToken };
    if (code) {
        body.code = code;
    }
    if (scope) {
        body.scope = scope;
    }

    const response = await fetch(`${API_URL}/google-login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        // Return the data even on error to check for link_required
        if (data.link_required) {
            throw { isLinkRequired: true, data };
        }
        throw new Error(data.error || "Google login failed");
    }

    return data;
}

export async function linkGoogleAccount(email: string, password: string, googleId: string) {
    const response = await fetch(`${API_URL}/link-google-account`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({email, password, google_id: googleId}),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to link Google account");
    }

    return data;
}

export async function connectGoogleCalendar(code: string) {
    return authenticatedFetch("/connect-google-calendar", {
        method: "POST",
        body: JSON.stringify({ code }),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to connect Google Calendar");
        }
        return data;
    });
}

export async function changePassword(oldPassword: string, newPassword: string) {
    return authenticatedFetch("/change-password", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to change password");
        }
        return data;
    });
}

export async function refreshAccessToken(refreshToken: string) {
    const response = await fetch(`${API_URL}/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to refresh token");
    }

    return data;
}

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");

    if (!token) {
        console.warn("No token found in localStorage for authenticated request to:", url);
    }

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    return fetch(`${API_URL}${url}`, {
        ...options,
        headers,
        credentials: "include",
    });
}

export async function getUserProfile() {
    return authenticatedFetch("/profile", {
        method: "GET",
    }).then(res => res.json());
}

export async function forgotPassword(email: string) {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to request password reset");
    }

    return data;
}

export async function resetPassword(token: string, newPassword: string) {
    const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, new_password: newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
    }

    return data;
}

export async function verifyEmail(token: string) {
    const response = await fetch(`${API_URL}/verify-email?token=${token}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to verify email");
    }

    return data;
}

export async function resendVerificationEmail(email: string) {
    const response = await fetch(`${API_URL}/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification email");
    }

    return data;
}

// Sport Complexes API
export async function getAllSportComplexes() {
    const response = await fetch(`${API_URL}/sport-complexes`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sport complexes");
    }

    return data;
}

export async function getSportComplexById(id: number) {
    const response = await fetch(`${API_URL}/sport-complexes/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sport complex");
    }

    return data;
}

export async function getFacilitiesByComplexId(id: number) {
    const response = await fetch(`${API_URL}/sport-complexes/${id}/facilities`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch facilities");
    }

    return data;
}

// Facilities API
export async function getAllFacilities() {
    const response = await fetch(`${API_URL}/facilities`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch facilities");
    }

    return data;
}

export async function searchFacilities(params: {
    city?: string;
    sport?: string;
    surface?: string;
    environment?: string;
    min_capacity?: number;
    max_capacity?: number;
    sort_by?: string;
    sort_order?: string;
}) {
    const queryParams = new URLSearchParams();

    if (params.city) queryParams.append("city", params.city);
    if (params.sport) queryParams.append("sport", params.sport);
    if (params.surface) queryParams.append("surface", params.surface);
    if (params.environment) queryParams.append("environment", params.environment);
    if (params.min_capacity) queryParams.append("min_capacity", params.min_capacity.toString());
    if (params.max_capacity) queryParams.append("max_capacity", params.max_capacity.toString());
    if (params.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params.sort_order) queryParams.append("sort_order", params.sort_order);

    const response = await fetch(`${API_URL}/facilities/search?${queryParams.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to search facilities");
    }

    return data;
}

export async function getCities() {
    const response = await fetch(`${API_URL}/facilities/metadata/cities`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch cities");
    }

    return data;
}

export async function getFacilityById(id: number) {
    const response = await fetch(`${API_URL}/facilities/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch facility");
    }

    return data;
}

export async function createSportComplex(complexData: {
    name: string;
    address: string;
    city: string;
    description: string;
    image_urls?: string[];
    facilities?: Array<{
        name: string;
        category_id: number;
        surface_id: number;
        environment_id: number;
        description: string;
        capacity: number;
        image_urls?: string[];
        working_hours?: Array<{
            day_type: "weekday" | "weekend";
            open_time: string;
            close_time: string;
        }>;
        pricing?: Array<{
            day_type: "weekday" | "weekend";
            start_hour: string;
            end_hour: string;
            price_per_hour: number;
        }>;
    }>;
}) {
    return authenticatedFetch("/sport-complexes", {
        method: "POST",
        body: JSON.stringify(complexData),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to create sport complex");
        }
        return data;
    });
}

export async function getMySportComplexes() {
    return authenticatedFetch("/sport-complexes/my", {
        method: "GET",
    }).then(async res => {
        let data;
        try {
            data = await res.json();
        } catch (e) {
            console.error("Failed to parse response as JSON:", e);
            throw new Error("Failed to fetch sport complexes: Invalid response");
        }
        if (!res.ok) {
            console.error("getMySportComplexes error:", res.status, data);
            throw new Error(data.error || "Failed to fetch sport complexes");
        }
        return data;
    });
}

export async function createFacility(facilityData: {
    name: string;
    sport_complex_id?: number | null;
    category_id: number;
    surface_id: number;
    environment_id: number;
    description: string;
    capacity: number;
    city?: string;
    address?: string;
    image_urls?: string[];
    working_hours?: Array<{
        day_type: "weekday" | "weekend";
        open_time: string;
        close_time: string;
    }>;
    pricing?: Array<{
        day_type: "weekday" | "weekend";
        start_hour: string;
        end_hour: string;
        price_per_hour: number;
    }>;
}) {
    return authenticatedFetch("/facilities", {
        method: "POST",
        body: JSON.stringify(facilityData),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to create facility");
        }
        return data;
    });
}

export async function updateFacility(facilityId: number, facilityData: {
    name: string;
    sport_complex_id?: number | null;
    category_id: number;
    surface_id: number;
    environment_id: number;
    description: string;
    capacity: number;
    city?: string;
    address?: string;
}) {
    return authenticatedFetch(`/facilities/${facilityId}`, {
        method: "PUT",
        body: JSON.stringify(facilityData),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to update facility");
        }
        return data;
    });
}

export async function getCategories() {
    const response = await fetch(`${API_URL}/facilities/metadata/categories`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch categories");
    }

    return data;
}

export async function getSports() {
    const response = await fetch(`${API_URL}/facilities/metadata/sports`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sports");
    }

    return data;
}

export async function getSurfaces() {
    const response = await fetch(`${API_URL}/facilities/metadata/surfaces`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch surfaces");
    }

    return data;
}

export async function getEnvironments() {
    const response = await fetch(`${API_URL}/facilities/metadata/environments`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch environments");
    }

    return data;
}

// Get images for an entity (facility or sport_complex)
export async function getEntityImages(entityType: string, entityId: number) {
    const response = await fetch(`${API_URL}/images/${entityType}/${entityId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch images");
    }

    return data;
}

// Get user's own facilities
export async function getMyFacilities() {
    return authenticatedFetch("/facilities/my", {
        method: "GET",
    }).then(async res => {
        let data;
        try {
            data = await res.json();
        } catch (e) {
            console.error("Failed to parse response as JSON:", e);
            throw new Error("Failed to fetch facilities: Invalid response");
        }
        if (!res.ok) {
            console.error("getMyFacilities error:", res.status, data);
            throw new Error(data.error || "Failed to fetch facilities");
        }
        return data;
    });
}

// Admin endpoints
export async function getPendingFacilities() {
    return authenticatedFetch("/admin/facilities/pending", {
        method: "GET",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to fetch pending facilities");
        }
        return data;
    });
}

export async function getPendingSportComplexes() {
    return authenticatedFetch("/admin/sport-complexes/pending", {
        method: "GET",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to fetch pending sport complexes");
        }
        return data;
    });
}

export async function verifyFacility(facilityId: number) {
    return authenticatedFetch(`/admin/facilities/${facilityId}/verify`, {
        method: "POST",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to verify facility");
        }
        return data;
    });
}

export async function verifySportComplex(complexId: number) {
    return authenticatedFetch(`/admin/sport-complexes/${complexId}/verify`, {
        method: "POST",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to verify sport complex");
        }
        return data;
    });
}

export async function toggleFacilityStatus(facilityId: number, isActive: boolean) {
    return authenticatedFetch(`/admin/facilities/${facilityId}/toggle-status`, {
        method: "POST",
        body: JSON.stringify({ is_active: isActive }),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to toggle facility status");
        }
        return data;
    });
}

export async function toggleComplexStatus(complexId: number, isActive: boolean) {
    return authenticatedFetch(`/admin/sport-complexes/${complexId}/toggle-status`, {
        method: "POST",
        body: JSON.stringify({ is_active: isActive }),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to toggle complex status");
        }
        return data;
    });
}

// Reservation API
export async function getFacilityAvailability(facilityId: number, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const queryString = params.toString();
    const url = `/facilities/${facilityId}/availability${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(`${API_URL}${url}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch facility availability");
    }

    return data;
}

export async function createReservation(reservationData: {
    facility_id: number;
    start_time: string;
    end_time: string;
}) {
    return authenticatedFetch("/reservations", {
        method: "POST",
        body: JSON.stringify(reservationData),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to create reservation");
        }
        return data;
    });
}

export async function getMyReservations() {
    return authenticatedFetch("/reservations/my", {
        method: "GET",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to fetch reservations");
        }
        return data;
    });
}

export async function cancelReservation(reservationId: number) {
    return authenticatedFetch(`/reservations/${reservationId}/cancel`, {
        method: "POST",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to cancel reservation");
        }
        return data;
    });
}

// Event API
export async function getAllEvents(status?: string, sportId?: number) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (sportId) params.append("sport_id", sportId.toString());

    const queryString = params.toString();
    const url = `/events${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(`${API_URL}${url}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch events");
    }

    return data;
}

export async function getEventById(eventId: number) {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch event");
    }

    return data;
}

export async function createEvent(eventData: {
    title: string;
    description?: string;
    sport_id: number;
    start_time: string;
    end_time: string;
    max_participants: number;
    facility_id?: number;
    address?: string;
    related_booking_id?: number;
}) {
    return authenticatedFetch("/events", {
        method: "POST",
        body: JSON.stringify(eventData),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to create event");
        }
        return data;
    });
}

export async function updateEvent(eventId: number, updateData: {
    title?: string;
    description?: string;
    sport_id?: number;
    start_time?: string;
    end_time?: string;
    max_participants?: number;
    status?: string;
    facility_id?: number;
    address?: string;
}) {
    return authenticatedFetch(`/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to update event");
        }
        return data;
    });
}

export async function deleteEvent(eventId: number) {
    return authenticatedFetch(`/events/${eventId}`, {
        method: "DELETE",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to delete event");
        }
        return data;
    });
}

export async function joinEvent(eventId: number) {
    return authenticatedFetch(`/events/${eventId}/join`, {
        method: "POST",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to join event");
        }
        return data;
    });
}

export async function leaveEvent(eventId: number) {
    return authenticatedFetch(`/events/${eventId}/leave`, {
        method: "POST",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to leave event");
        }
        return data;
    });
}

export async function getEventParticipants(eventId: number) {
    const response = await fetch(`${API_URL}/events/${eventId}/participants`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch event participants");
    }

    return data;
}

export async function getMyEvents() {
    return authenticatedFetch("/users/me/events", {
        method: "GET",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to fetch user events");
        }
        return data;
    });
}

export async function getMyJoinedEvents() {
    return authenticatedFetch("/users/me/events/joined", {
        method: "GET",
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to fetch joined events");
        }
        return data;
    });
}


