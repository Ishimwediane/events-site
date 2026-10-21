import { useState, useEffect } from "react";
import { X, Loader2, Ticket, Vote, Layers } from "lucide-react";

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    isLoading?: boolean;
}

const AUTH_OPTIONS = [
    {
        value: "EVENTS",
        label: "Events Only",
        desc: "Can create and manage events & ticket sales",
        icon: Ticket,
        color: "#F39C12",
    },
    {
        value: "VOTING",
        label: "Voting Only",
        desc: "Can create and manage voting campaigns",
        icon: Vote,
        color: "#6c4ef2",
    },
    {
        value: "BOTH",
        label: "Events & Voting",
        desc: "Full access — events, tickets and voting",
        icon: Layers,
        color: "#1e8a5e",
    },
];

export default function ApplicationModal({ isOpen, onClose, onSubmit, initialData, isLoading }: ApplicationModalProps) {
    const [formData, setFormData] = useState({
        company_name: "",
        email: "",
        phone: "",
        description: "",
        status: "PENDING",
        authorization: "BOTH",
        rejection_reason: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                company_name: initialData.company_name || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                description: initialData.description || "",
                status: initialData.status || "PENDING",
                authorization: initialData.authorization || "BOTH",
                rejection_reason: initialData.rejection_reason || "",
            });
        } else {
            setFormData({
                company_name: "",
                email: "",
                phone: "",
                description: "",
                status: "PENDING",
                authorization: "BOTH",
                rejection_reason: "",
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const isApproving = formData.status === "APPROVED";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">
                        {initialData ? "Edit Application" : "Create Application"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                Company Name
                            </label>
                            <input
                                required
                                readOnly={!!initialData}
                                type="text"
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium ${initialData ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-800'}`}
                                placeholder="Enter company name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                    Email
                                </label>
                                <input
                                    required
                                    readOnly={!!initialData}
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium ${initialData ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-800'}`}
                                    placeholder="Company email"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                    Phone
                                </label>
                                <input
                                    required
                                    readOnly={!!initialData}
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium ${initialData ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-800'}`}
                                    placeholder="Phone number"
                                />
                            </div>
                        </div>

                        {/* Provide readonly view of the description */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                Description
                            </label>
                            <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600 font-medium">
                                {formData.description || "No description provided."}
                            </div>
                        </div>

                        {/* Status selector — only shown when editing */}
                        {initialData && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                    >
                                        <option value="PENDING">PENDING</option>
                                        <option value="APPROVED">APPROVED</option>
                                        <option value="REJECTED">REJECTED</option>
                                    </select>
                                </div>

                                {/* Rejection Reason - shown if rejected */}
                                {formData.status === "REJECTED" && (
                                    <div className="p-4 rounded-xl border border-red-100 bg-red-50/50">
                                        <label className="block text-xs font-bold text-red-700 mb-1.5 uppercase tracking-wide">
                                            Rejection Reason
                                        </label>
                                        <textarea
                                            value={formData.rejection_reason}
                                            onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none placeholder:text-red-300"
                                            placeholder="Explain why this application was rejected..."
                                            required={formData.status === "REJECTED"}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Authorization — shown when editing AND approving */}
                        {initialData && isApproving && (
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                    Authorization Package
                                </label>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {AUTH_OPTIONS.map(({ value, label, desc, icon: Icon, color }) => {
                                        const selected = formData.authorization === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, authorization: value })}
                                                className="flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all"
                                                style={{
                                                    borderColor: selected ? color : "#e5e7eb",
                                                    background: selected ? `${color}0f` : "#f9fafb",
                                                }}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                                    style={{ background: selected ? color : "#e5e7eb" }}
                                                >
                                                    <Icon className="w-4 h-4" style={{ color: selected ? "#fff" : "#9ca3af" }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800">{label}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                                                </div>
                                                {selected && (
                                                    <div
                                                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                                        style={{ background: color }}
                                                    >
                                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                                            <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    This determines what the company can manage in their dashboard.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                            style={{ background: "#F39C12" }}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {initialData ? "Save Changes" : "Create Application"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
