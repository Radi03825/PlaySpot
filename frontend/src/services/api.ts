const API_URL = "http://localhost:8081/api";

export async function register(name: string, email: string, password: string) {
    return fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // важно за cookie session
        body: JSON.stringify({ name, email, password }),
    });
}

export async function login(email: string, password: string) {
    let promise = fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
    }).then(res => res.json());

    console.log(promise)

    return promise;
}
