import { api } from "@/platform/lib/api";

export const authService = {
    async login(credentials: any) {
        // Start from a clean slate so any stale session (e.g. after a DB reset) can't linger.
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        const response = await api.post("/auth/token/", credentials);
        if (response.data.access) {
            localStorage.setItem("access_token", response.data.access);
            localStorage.setItem("refresh_token", response.data.refresh);

            // Fetch profile and store role
            const user = await this.getCurrentUser();
            localStorage.setItem("user", JSON.stringify(user));
        }
        return response.data;
    },

    async register(userData: any) {
        const response = await api.post("/users/", userData);
        return response.data;
    },

    async registerCompany(data: { email: string; password: string; first_name: string; last_name: string }) {
        // Step 1: Register new user (default role = CUSTOMER; approval will upgrade to COMPANY)
        await api.post("/users/", { ...data });

        // Step 2: Auto-login to get JWT tokens
        const loginRes = await api.post("/auth/token/", {
            email: data.email,
            password: data.password,
        });
        localStorage.setItem("access_token", loginRes.data.access);
        localStorage.setItem("refresh_token", loginRes.data.refresh);

        // Step 3: Fetch and store user profile
        const user = await this.getCurrentUser();
        localStorage.setItem("user", JSON.stringify(user));
        return user;
    },

    async logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/";
    },

    async getCurrentUser() {
        const response = await api.get("/users/me/");
        return response.data;
    },

    async updateProfile(data: { first_name?: string; last_name?: string }) {
        const response = await api.patch("/users/me/", data);

        // Update local storage if the user is cached
        const currentUser = this.getUserFromStorage();
        if (currentUser) {
            localStorage.setItem("user", JSON.stringify({ ...currentUser, ...response.data }));
        }

        return response.data;
    },

    getUserFromStorage() {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }
};
