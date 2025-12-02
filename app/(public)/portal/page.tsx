"use client";

import ServiceCard from "../components/ServiceCard";
import AccessGuard from "../components/AccessGuard";
import Header from "../components/Header";
import {
  ClipboardList,
  School,
  FileText,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PortalPage = () => {
  const portalServices = [
    {
      title: "Validation List",
      description: "Verify and validate student registration records",
      icon: ClipboardList,
      href: "/validation",
      variant: "primary" as const,
    },
    {
      title: "Primary School Registration",
      description: "Register new students for primary education",
      icon: School,
      href: "/school-registration",
      variant: "primary" as const,
    },
    {
      title: "Post Registration",
      description: "Manage post-registration activities and updates",
      icon: UserPlus,
      href: "/post-registration",
      variant: "primary" as const,
    },
  
  ];

  return (
    <AccessGuard>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <Alert className="mb-8 border-primary/20 bg-accent">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                For primary portal access, please visit{" "}
                <a
                  href="https://www.dsgmope.ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary underline hover:text-primary/80"
                >
                  www.dsgmope.ng
                </a>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portalServices.map((service, index) => (
                <ServiceCard key={index} {...service} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </AccessGuard>
  );
};

export default PortalPage;
