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

