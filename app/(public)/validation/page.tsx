"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';

const Validation = () => {
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
              <CardTitle className="text-2xl">Validation List</CardTitle>
              <CardDescription>
                Verify and validate student registration records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="registration-number">Registration Number</Label>
                  <Input
                    id="registration-number"
                    placeholder="Enter registration number"
                    type="text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validation-year">Validation Year</Label>
                  <Input
                    id="validation-year"
                    placeholder="e.g., 2024"
                    type="text"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Validate Record
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Validation;
