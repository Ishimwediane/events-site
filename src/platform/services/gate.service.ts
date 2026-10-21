import { api } from '@/platform/lib/api';

/** What the door person sees. Refusals come back as 200 with a result code, not as errors. */
export type ScanResult =
    | 'ADMITTED'
    | 'ALREADY_USED'
    | 'WRONG_EVENT'
    | 'NOT_FOUND';

export interface ScannedTicket {
    code: string;
    full_name: string;
    email: string;
    ticket_type: string;
    event: string;
    is_hard: boolean;
    purchase_date: string;
}

export interface GateStats {
    total: number;
    checked_in: number;
    remaining: number;
}

export interface ScanResponse {
    result: ScanResult;
    message: string;
    ticket: ScannedTicket | null;
    stats: GateStats;
    /** Present on ALREADY_USED: when and by whom the ticket was first admitted. */
    checked_in_at?: string;
    checked_in_by?: string;
}

export interface GateEvent {
    id: string;
    title: string;
    location: string;
    start_date: string | null;
    status: string;
}

export interface RecentScan {
    id: string;
    code: string;
    result: ScanResult | 'UNDONE';
    full_name: string;
    ticket_type: string;
    scanned_by: string;
    created_at: string;
}

export interface TierBreakdown {
    name: string;
    total: number;
    checked_in: number;
    remaining: number;
}

export interface ReportScan extends RecentScan {
    email: string;
    is_hard: boolean;
}

export interface GateReport {
    event: { id: string; title: string; location: string };
    stats: GateStats;
    tiers: TierBreakdown[];
    /** Tally per outcome across the whole event, unaffected by the current filter. */
    result_counts: Record<string, number>;
    /** Matches the current filter, for paging. */
    total_scans: number;
    scans: ReportScan[];
}

export const gateService = {
    /** Events this account may run a gate for. */
    getEvents: async () => {
        const res = await api.get('/tickets/gate/events/');
        return res.data as GateEvent[];
    },

    /** Validate a code and admit the holder if it is good. */
    scan: async (eventId: string, code: string) => {
        const res = await api.post('/tickets/gate/scan/', { event_id: eventId, code });
        return res.data as ScanResponse;
    },

    getStats: async (eventId: string) => {
        const res = await api.get(`/tickets/gate/stats/?event_id=${eventId}`);
        return res.data as { event: string; stats: GateStats };
    },

    getRecent: async (eventId: string, limit = 20) => {
        const res = await api.get(`/tickets/gate/recent/?event_id=${eventId}&limit=${limit}`);
        return res.data as RecentScan[];
    },

    /**
     * Full check-in record for an event: counts, per-tier arrivals, and the scan
     * log including refusals. Organizer/admin only.
     */
    getReport: async (
        eventId: string,
        opts: { result?: string; limit?: number; offset?: number } = {}
    ) => {
        const q = new URLSearchParams({ event_id: eventId });
        if (opts.result) q.set('result', opts.result);
        if (opts.limit != null) q.set('limit', String(opts.limit));
        if (opts.offset != null) q.set('offset', String(opts.offset));
        const res = await api.get(`/tickets/gate/report/?${q.toString()}`);
        return res.data as GateReport;
    },

    /** Reverse a check-in. Organizer/admin only — gate staff get a 403. */
    undo: async (eventId: string, code: string) => {
        const res = await api.post('/tickets/gate/undo/', { event_id: eventId, code });
        return res.data as { result: string; message: string; stats: GateStats };
    },
};
