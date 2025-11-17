"use client";

import { Building2, GraduationCap } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { useEffect, useState } from "react";

const Header = () => {
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  useEffect(() => {
    const info = localStorage.getItem("schoolInfo");
    if (info) {
      setSchoolInfo(JSON.parse(info));
    }
  }, []);

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
              <p className="text-md md:text-xl lg:text-3xl opacity-90 flex items-center gap-2">
                
                Ministry of Primary Education Portal
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {schoolInfo && (
              <div className="hidden md:block text-right text-sm">
                <p className="font-semibold">{schoolInfo.schoolName}</p>
                <p className="text-xs opacity-80">LGA: {schoolInfo.lgaCode} | School: {schoolInfo.schoolCode}</p>
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    </header>
  );
};

export default Header;
