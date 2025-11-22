"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { getLGAName } from "@/lib/lga-mapping";
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

  // Check if user is already authenticated
  useEffect(() => {
    const accessToken = getCookie('accessToken');
    if (accessToken) {
      // User is already authenticated, redirect to portal
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

      // Store access token in both cookies and localStorage
      // Cookies for persistence, localStorage for backward compatibility
      setCookie('accessToken', data.token, 7); // 7 days
      setCookie('schoolInfo', JSON.stringify(data.school), 7);
      localStorage.setItem("accessToken", data.token);
      localStorage.setItem("schoolInfo", JSON.stringify(data.school));

      // Redirect to portal page
      router.push("/portal");
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-primary">
            Portal Access
          </CardTitle>
          <CardDescription className="text-base">
            Enter your LGA, school code, and access PIN to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="lgaCode">LGA Code</Label>
              <Input
                id="lgaCode"
                type="text"
                placeholder="Enter LGA code"
                value={formData.lgaCode}
                onChange={(e) =>
                  setFormData({ ...formData, lgaCode: e.target.value })
                }
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolCode">School Code</Label>
              <Input
                id="schoolCode"
                type="text"
                placeholder="Enter school code"
                value={formData.schoolCode}
                onChange={(e) =>
                  setFormData({ ...formData, schoolCode: e.target.value })
                }
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessPin">Access PIN</Label>
              <Input
                id="accessPin"
                type="password"
                placeholder="Enter access PIN"
                value={formData.accessPin}
                onChange={(e) =>
                  setFormData({ ...formData, accessPin: e.target.value })
                }
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Access Portal"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
