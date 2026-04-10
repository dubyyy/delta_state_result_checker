"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const CIEAuthGate = dynamic(() => import("./CIEAuthGate"), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse rounded-full" />
                <div className="relative h-12 w-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-600 ring-1 ring-blue-50">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            </div>
        </div>
    )
});

export default function CIEAuthGateWrapper({ children }: { children: React.ReactNode }) {
    return <CIEAuthGate>{children}</CIEAuthGate>;
}
