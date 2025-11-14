import { Building2, GraduationCap } from "lucide-react";
import Link from "next/link";

const Header = () => {
  return (
    <header className="gradient-primary text-primary-foreground shadow-lg sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 md:gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
              <div className="relative bg-white/10 p-2 md:p-3 rounded-full backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                <Building2 className="h-7 w-7 md:h-9 md:w-9" />
              </div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight tracking-tight">
                Delta State Government
              </h1>
              <p className="text-xs md:text-sm lg:text-base opacity-90 flex items-center gap-2">
                <GraduationCap className="h-3 w-3 md:h-4 md:w-4" />
                Ministry of Primary Education Portall
              </p>
            </div>
          </Link>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    </header>
  );
};

export default Header;
