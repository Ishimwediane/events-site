import axios from "axios";

import { envOr } from "@/lib/env";

// Same default as the public site (src/lib/api.ts), so a build without the
// variable still talks to the live API instead of localhost.
export const API_URL = envOr(process.env.NEXT_PUBLIC_API_URL, "https://api.ozoneentertainmentz.com/api");

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor for JWT
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Clear all auth state and send the user to login (without creating a redirect loop).
const clearAuthAndRedirect = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user"); // also drop the cached profile so route guards don't re-enter protected pages
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
};

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const requestUrl: string = originalRequest?.url || "";

        // Never try to "refresh" the auth endpoints themselves — a 401 there means the
        // credentials/refresh token are invalid, so refreshing would just loop.
        const isAuthEndpoint = requestUrl.includes("/auth/token");

        if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            const refreshToken =
                typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;

            // No refresh token → can't recover; clean up and bounce to login.
            if (!refreshToken) {
                clearAuthAndRedirect();
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(`${API_URL}/auth/token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = res.data;
                localStorage.setItem("access_token", access);

                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Stale/expired refresh token (e.g. after a DB reset) — wipe auth and redirect.
                clearAuthAndRedirect();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
