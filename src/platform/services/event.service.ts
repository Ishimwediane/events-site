import { api } from "@/platform/lib/api";

export const eventService = {
    async getEvents() {
        const response = await api.get("/events/");
        return response.data;
    },

    async getEventDetails(slug: string) {
        const response = await api.get(`/events/${slug}/`);
        return response.data;
    },

    async purchaseTicket(purchaseData: { ticket_type_id: string; quantity: number; full_name?: string; email?: string }) {
        const response = await api.post("/tickets/checkout/purchase/", purchaseData);
        return response.data;
    },

    async getCategories() {
        const response = await api.get("/events/categories/");
        return response.data;
    },

    async createCategory(name: string) {
        const response = await api.post("/events/categories/", { name });
        return response.data;
    },

    async createEvent(eventData: any) {
        const isFormData = eventData instanceof FormData;
        const response = await api.post("/events/", eventData, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
        });
        return response.data;
    },

    async updateEvent(id: string, eventData: any) {
        const isFormData = eventData instanceof FormData;
        const response = await api.patch(`/events/${id}/`, eventData, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
        });
        return response.data;
    },

    async deleteEvent(id: string) {
        const response = await api.delete(`/events/${id}/`);
        return response.data;
    }
};
