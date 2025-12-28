const API_URL = "http://localhost:8081/api"; //TODO: move to env variable

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
    facilities?: Array<{
        name: string;
        category_id: number;
        surface_id: number;
        environment_id: number;
        description: string;
        capacity: number;
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

