"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user has access token
    const accessToken = localStorage.getItem("accessToken");
    
    if (!accessToken) {
      // Redirect to access page if no token
      router.push("/access");
    } else {
      setIsAuthenticated(true);
    }
    
    setIsChecking(false);
  }, [router]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
