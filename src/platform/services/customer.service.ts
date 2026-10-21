import { api } from '@/platform/lib/api';

export const customerService = {
    /**
     * Fetch all unique customers who bought tickets for any of the company's events.
     * Returns an array annotated with total tickets bought, total spent, and last active date.
     */
    getGlobalCustomers: async () => {
        try {
            const response = await api.get('/tickets/checkout/customers/');
            return response.data;
        } catch (error) {
            console.error('Error fetching global customers:', error);
            throw error;
        }
    },
};
