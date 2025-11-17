"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Settings() {
  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage system settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Registration Settings</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Control global registration settings for the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 flex-1">
              <Label className="text-sm sm:text-base">Global Registration</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enable or disable student registration system-wide
              </p>
            </div>
            <Switch defaultChecked className="shrink-0" />
          </div>

          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 flex-1">
              <Label className="text-sm sm:text-base">Auto-approve Registrations</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Automatically approve new student registrations
              </p>
            </div>
            <Switch className="shrink-0" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-students" className="text-sm sm:text-base">Maximum Students per School</Label>
            <Input id="max-students" type="number" defaultValue="500" className="text-sm sm:text-base" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Notification Settings</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configure email notifications for system events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 flex-1">
              <Label className="text-sm sm:text-base">New Registration Alerts</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Receive notifications when students register
              </p>
            </div>
            <Switch defaultChecked className="shrink-0" />
          </div>

          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 flex-1">
              <Label className="text-sm sm:text-base">Daily Summary Reports</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Get daily summaries of registration activities
              </p>
            </div>
            <Switch defaultChecked className="shrink-0" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-sm sm:text-base">Admin Email</Label>
            <Input id="admin-email" type="email" placeholder="admin@example.com" className="text-sm sm:text-base" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">System Preferences</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Customize your admin dashboard experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="system-name" className="text-sm sm:text-base">System Name</Label>
            <Input id="system-name" defaultValue="Student Registration System" className="text-sm sm:text-base" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic-year" className="text-sm sm:text-base">Current Academic Year</Label>
            <Input id="academic-year" defaultValue="2024/2025" className="text-sm sm:text-base" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="w-full sm:w-auto">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
