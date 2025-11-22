"use client";

import Link from "next/link";
import Image from "next/image";

const PublicHeader = () => {
  return (
    <header className="gradient-primary text-primary-foreground shadow-lg sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 md:gap-4 group">
            <div className="relative h-16 w-12 md:h-20 md:w-16 lg:h-26 lg:w-16">
              <Image
                src="/delta-logo.png"
                alt="Delta State Logo"
                fill
                className="object-contain"
                priority
              />
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
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    </header>
  );
};

export default PublicHeader;
