import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CIEAuthGateWrapper from "./CIEAuthGateWrapper";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "CIE Dashboard | Delta State Ministry of Basic and Secondary Education",
    description: "Chief Inspector of Education Dashboard",
};

export default function CIELayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${inter.className} antialiased min-h-screen flex flex-col`}>
                <main className="flex-1">
                    <CIEAuthGateWrapper>{children}</CIEAuthGateWrapper>
                </main>
                <Toaster />
            </body>
        </html>
    );
}
