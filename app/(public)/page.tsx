import ServiceCard from "./components/ServiceCard";
import {
  FileCheck,
  GraduationCap,
  UserPlus,
  ClipboardList,
  School,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";


const Index = () => {
  const services = [
    
    {
      title: "Check Primary Result",
      description: "View primary school examination results and records",
      icon: FileText,
      href: "/primary-result",
      variant: "secondary" as const,
    },
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
      variant: "secondary" as const,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">

      
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Welcome to the Education Portal
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Access examination results, registration services, and validation tools
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </main>

    </div>
  );
};

export default Index;
