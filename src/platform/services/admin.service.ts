import { api } from "@/platform/lib/api";

export const adminService = {
    async getSystemStats() {
        const response = await api.get("/users/stats/");
        return response.data;
    },

    async getApplications() {
        const response = await api.get("/companies/applications/");
        // API may return a paginated object ({ results: [...] }) or a plain array.
        return Array.isArray(response.data) ? response.data : response.data?.results ?? [];
    },

    async updateApplicationStatus(id: string, status: "APPROVED" | "REJECTED") {
        const response = await api.patch(`/companies/applications/${id}/`, { status });
        return response.data;
    }
};
