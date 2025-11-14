import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  variant?: "primary" | "secondary";
}

const ServiceCard = ({
  title,
  description,
  icon: Icon,
  href,
  variant = "primary",
}: ServiceCardProps) => {
  return (
    <Link href={href}>
      <Card className="h-full transition-all duration-300 hover:shadow-hover hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50">
        <CardContent className="p-6">
          <div
            className={`inline-flex p-3 rounded-lg mb-4 ${
              variant === "primary" ? "bg-primary/10" : "bg-secondary/30"
            }`}
          >
            <Icon
              className={`h-6 w-6 ${
                variant === "primary" ? "text-primary" : "text-secondary-foreground/90"
              }`}
            />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-card-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ServiceCard;
