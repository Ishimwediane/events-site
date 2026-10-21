import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Calendar, FileText, Image as ImageIcon } from "lucide-react";
import { api } from "@/platform/lib/api";

interface CreateVotingCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateVotingCampaignModal({ isOpen, onClose, onSuccess }: CreateVotingCampaignModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                end_date: formData.end_date || null,  // send null not empty string
            };
            await api.post("/voting/campaigns/", payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create campaign", error);
            alert("Failed to create campaign. Please check the fields.");
        } finally {
            setIsLoading(false);
            setFormData({ title: "", description: "", start_date: "", end_date: "" });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100/50 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">New Voting Campaign</h2>
                                    <p className="text-sm font-medium text-gray-500 mt-1">Set up a new public voting festival or award.</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5 uppercase tracking-wide">
                                            <FileText className="w-4 h-4 text-amber-500" />
                                            Campaign Title
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-medium focus:outline-hidden focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                                            placeholder="e.g. Rwanda Music Awards 2025"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-2.5 uppercase tracking-wide">Description</label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-medium focus:outline-hidden focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 focus:bg-white transition-all resize-none h-32 text-gray-900 placeholder:text-gray-400"
                                            placeholder="Describe the voting campaign and its purpose..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5 uppercase tracking-wide">
                                                <Calendar className="w-4 h-4 text-amber-500" />
                                                Start Date
                                            </label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 focus:bg-white transition-all text-gray-800"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5 uppercase tracking-wide">
                                                <Calendar className="w-4 h-4 text-amber-500" />
                                                End Date <span className="text-[10px] text-gray-400 font-bold tracking-normal normal-case">(Optional)</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:outline-hidden focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 focus:bg-white transition-all text-gray-800"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-6 py-4 bg-gray-50 border-2 border-transparent hover:border-gray-200 hover:bg-gray-100 rounded-2xl text-sm font-bold text-gray-600 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-[2] px-6 py-4 bg-gray-900 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                        style={{ background: "#F39C12" }}
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Campaign"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
