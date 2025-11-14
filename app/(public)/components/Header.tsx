import { Building2 } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-[#003366] text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-2 py-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">
              Delta State Government
            </h1>
            <p className="text-sm md:text-base opacity-90">
              Ministry of Primary Education Portal
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
