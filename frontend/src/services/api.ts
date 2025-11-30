const API_URL = "http://localhost:8081/api"; //TODO: move to env variable

export async function register(name: string, email: string, password: string) {
    return fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
    });
}

export async function login(email: string, password: string) {
    return fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({email, password}),
    }).then(res => res.json());
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

