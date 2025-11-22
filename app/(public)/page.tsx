import ServiceCard from "./components/ServiceCard";
import PublicHeader from "./components/PublicHeader";
import {
  School,
  AlertCircle,
  ClipboardCheck,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";


const Index = () => {
  const publicServices = [
    {
      title: "Check Primary Result",
      description: "View and verify primary examination results",
      icon: ClipboardCheck,
      href: "/primary-result",
      variant: "primary" as const,
    },
   
  ];

  const portalServices = [
    {
      title: "School Portal Access",
      description: "Access validation, registration and other services",
      icon: School,
      href: "/access",
      variant: "primary" as const,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
        
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Welcome to the Education Portal
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Check examination results or access the school portal
              </p>
            </div>

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

            <div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {publicServices.map((service, index) => (
                  <ServiceCard key={index} {...service} />
                ))}
                {portalServices.map((service, index) => (
                  <ServiceCard key={index} {...service} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
  );
};

export default Index;
