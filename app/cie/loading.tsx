import { ShieldCheck, Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse rounded-full" />
                <div className="relative h-16 w-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600 ring-1 ring-blue-50 animate-bounce">
                    <ShieldCheck className="h-8 w-8" />
                </div>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="tracking-wide">Loading CIE Portal...</span>
            </div>
        </div>
    );
}
