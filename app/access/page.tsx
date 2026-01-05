"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Loader2, 
  Eye,
  EyeOff,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Settings,
  FileCheck,
  ArrowRight
} from "lucide-react";
import { setCookie, getCookie } from "@/lib/cookies";

export default function AccessPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    lgaCode: "",
    schoolCode: "",
    accessPin: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showPin, setShowPin] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const accessToken = getCookie('accessToken');
    if (accessToken) {
      router.push("/portal");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/access/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed");
        setIsLoading(false);
        return;
      }

      setCookie('accessToken', data.token, 7);
      setCookie('schoolInfo', JSON.stringify(data.school), 7);
      localStorage.setItem("accessToken", data.token);
      localStorage.setItem("schoolInfo", JSON.stringify(data.school));

      router.push("/portal");
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F9FF]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6]" />
          </div>
          <span className="text-gray-500 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF] flex items-center justify-center p-4 md:p-8 font-[Inter]">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Panel - Form Card */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="shadow-xl border-0 bg-white rounded-[16px] overflow-hidden">
            <CardHeader className="space-y-2 pb-4 pt-8 px-8">
              <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                Portal Access
              </CardTitle>
              <CardDescription className="text-base text-gray-500">
                Enter your LGA Code, School Code, and Access PIN to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="rounded-[12px]">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* LGA Code Field */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="lga_code" 
                    className="text-sm font-medium text-gray-700"
                  >
                    LGA Code
                  </Label>
                  <Input
                    id="lga_code"
                    type="text"
                    placeholder="Enter LGA Code"
                    value={formData.lgaCode}
                    onChange={(e) =>
                      setFormData({ ...formData, lgaCode: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className="h-12 px-4 text-base rounded-[12px] border-gray-200 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 transition-all"
                  />
                </div>

                {/* School Code Field */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="school_code" 
                    className="text-sm font-medium text-gray-700"
                  >
                    School Code
                  </Label>
                  <Input
                    id="school_code"
                    type="text"
                    placeholder="Enter School Code"
                    value={formData.schoolCode}
                    onChange={(e) =>
                      setFormData({ ...formData, schoolCode: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className="h-12 px-4 text-base rounded-[12px] border-gray-200 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 transition-all"
                  />
                </div>

                {/* Access PIN Field */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="access_pin" 
                    className="text-sm font-medium text-gray-700"
                  >
                    Access PIN
                  </Label>
                  <div className="relative">
                    <Input
                      id="access_pin"
                      type={showPin ? "text" : "password"}
                      placeholder="Enter Access PIN"
                      value={formData.accessPin}
                      onChange={(e) =>
                        setFormData({ ...formData, accessPin: e.target.value })
                      }
                      required
                      disabled={isLoading}
                      className="h-12 px-4 pr-12 text-base rounded-[12px] border-gray-200 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPin ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-[12px] transition-all mt-2 shadow-lg shadow-[#3B82F6]/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Illustration */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="relative w-full max-w-lg aspect-square">
            {/* Background decorative circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-80 h-80 rounded-full bg-[#3B82F6]/5"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-[#3B82F6]/10"></div>
            </div>
            
            {/* Floating Icons */}
            <div className="absolute inset-0">
              {/* Student Reading - Top */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
                <BookOpen className="h-8 w-8 text-[#3B82F6]" />
              </div>
              
              {/* Graduation Cap - Right */}
              <div className="absolute top-1/3 right-8 w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                <GraduationCap className="h-7 w-7 text-[#10B981]" />
              </div>
              
              {/* Light Bulb - Bottom Right */}
              <div className="absolute bottom-1/4 right-12 w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '0.3s' }}>
                <Lightbulb className="h-6 w-6 text-[#F59E0B]" />
              </div>
              
              {/* Gears - Bottom */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '0.7s' }}>
                <Settings className="h-7 w-7 text-[#8B5CF6]" />
              </div>
              
              {/* Graded Paper - Left */}
              <div className="absolute top-1/3 left-8 w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: '2.6s', animationDelay: '0.2s' }}>
                <FileCheck className="h-6 w-6 text-[#EC4899]" />
              </div>
            </div>
            
            {/* Center main illustration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-2xl shadow-[#3B82F6]/30 flex items-center justify-center">
                <GraduationCap className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
