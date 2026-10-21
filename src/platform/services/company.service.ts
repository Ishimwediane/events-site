import { api } from "@/platform/lib/api";

export const companyService = {
    async applyToBeHost(data: { company_name: string; phone: string; description: string; email: string; authorization?: string }) {
        const response = await api.post("/companies/applications/", data);
        return response.data;
    },

    async adminCreateCompany(data: { name: string; email: string; password?: string; authorization: string; can_use_qr: boolean }) {
        const response = await api.post("/companies/admin/create/", data);
        return response.data;
    },

    async getMyCompanyProfile() {
        const response = await api.get("/companies/profile/me/");
        return response.data;
    },

    async updateMyCompanyProfile(data: any) {
        const response = await api.patch("/companies/profile/me/", data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });
        return response.data;
    },

    async getMyEvents() {
        const response = await api.get("/events/mine/");
        return response.data;
    }
};
