import { api } from '@/platform/lib/api';

export const ticketService = {
    /**
     * Fetch all ticket types (tiers) created by the logged-in company across all their events.
     * Uses the /api/tickets/types/mine/ endpoint built for the global dashboard view.
     */
    getMyTickets: async () => {
        try {
            const response = await api.get('/tickets/types/mine/');
            return response.data;
        } catch (error) {
            console.error('Error fetching global tickets:', error);
            throw error;
        }
    },

    createTicketType: async (data: any) => {
        const response = await api.post('/tickets/types/', data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });
        return response.data;
    },

    updateTicketType: async (id: string, data: any) => {
        const response = await api.patch(`/tickets/types/${id}/`, data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });
        return response.data;
    },

    deleteTicketType: async (id: string) => {
        const response = await api.delete(`/tickets/types/${id}/`);
        return response.data;
    },

    getEventAttendees: async (eventId: string) => {
        const response = await api.get(`/tickets/list/event_attendees/?event_id=${eventId}`);
        return response.data;
    },

    /**
     * Create a batch of physical ("hard") tickets for a tier. Returns the created
     * ticket ids/codes. Consumes the tier's remaining capacity.
     */
    generateHardTickets: async (ticketTypeId: string, quantity: number) => {
        const response = await api.post('/tickets/list/generate_hard/', {
            ticket_type_id: ticketTypeId,
            quantity,
        });
        return response.data as { count: number; ticket_ids: string[]; codes: string[] };
    },

    /**
     * Download the printable QR-code PDF for the given ticket ids. Reprint-safe:
     * creates nothing, so it can be called again for the same batch.
     */
    downloadHardSheet: async (ticketIds: string[]) => {
        const response = await api.post(
            '/tickets/list/hard_sheet/',
            { ticket_ids: ticketIds },
            { responseType: 'blob' }
        );
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'hard-tickets-qr.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    /** Admin: fetch tickets that never received a confirmation email. */
    getUnsentEmails: async (hours = 72) => {
        const response = await api.get(`/tickets/list/unsent_emails/?hours=${hours}`);
        return response.data as { count: number; tickets: UnsentTicket[] };
    },

    /** Admin/Company: resend confirmation email for a specific ticket code, optionally updating the email address. */
    resendTicketEmail: async (ticketCode: string, newEmail?: string) => {
        const response = await api.post('/tickets/list/resend_email/', { 
            ticket_code: ticketCode,
            new_email: newEmail
        });
        return response.data as { sent: string[]; failed: any[]; message: string };
    },
};

export interface UnsentTicket {
    id: string;
    ticket_code: string;
    email: string;
    full_name: string;
    event: string;
    ticket_type: string;
    purchase_date: string;
}
