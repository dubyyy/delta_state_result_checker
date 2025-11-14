"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';

const SchoolRegistration = () => {
  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Primary School Registration</CardTitle>
              <CardDescription>
                Register new students for primary education
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="student-name">Student Full Name</Label>
                  <Input
                    id="student-name"
                    placeholder="Enter student's full name"
                    type="text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-of-birth">Date of Birth</Label>
                  <Input
                    id="date-of-birth"
                    type="date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent-name">Parent/Guardian Name</Label>
                  <Input
                    id="parent-name"
                    placeholder="Enter parent or guardian name"
                    type="text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input
                    id="contact"
                    placeholder="+234 XXX XXX XXXX"
                    type="tel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school-choice">School Choice</Label>
                  <Input
                    id="school-choice"
                    placeholder="Preferred primary school"
                    type="text"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Submit Registration
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SchoolRegistration;
