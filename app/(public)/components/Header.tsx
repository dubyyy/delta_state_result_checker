"use client";

import { Building2, GraduationCap } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { useEffect, useState } from "react";
import { getCookie } from "@/lib/cookies";
import Image from "next/image";

const Header = () => {
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  useEffect(() => {
    // Check cookies first, then localStorage
    const cookieInfo = getCookie('schoolInfo');
    const localInfo = localStorage.getItem("schoolInfo");
    const info = cookieInfo || localInfo;
    
    if (info) {
      try {
        setSchoolInfo(JSON.parse(info));
      } catch (e) {
        console.error('Failed to parse school info:', e);
      }
    }
  }, []);

  return (
    <header className="gradient-primary text-primary-foreground shadow-lg sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 md:gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
               <div className="relative h-16 w-12 md:h-20 md:w-16 lg:h-26 lg:w-16">
                <Image src="/delta-logo.png" alt="Delta State Logo" fill className="object-contain" priority />
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
