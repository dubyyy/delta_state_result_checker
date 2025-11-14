'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const CheckResit = () => {
  const [formData, setFormData] = useState({
    pinCode: '',
    serial: '',
    examNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted Data:', formData);

    // Example API call (uncomment when ready)
    // try {
    //   const res = await fetch('/api/check-resit', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(formData),
    //   });
    //   const data = await res.json();
    //   // Handle response
    // } catch (error) {
    //   console.error('Error:', error);
    // }
  };

  return (
    <div className="min-h-screen flex flex-col">
      

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Check Resit-Result Status</CardTitle>
              <CardDescription>
                Enter your examination details to view your resit result status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="pinCode">Pin Code</Label>
                  <Input
                    id="pinCode"
                    placeholder="Enter your pin code"
                    type="text"
                    value={formData.pinCode}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serial">Serial</Label>
                  <Input
                    id="serial"
                    placeholder="Enter your serial number"
                    type="text"
                    value={formData.serial}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examNumber">Examination Number</Label>
                  <Input
                    id="examNumber"
                    placeholder="Enter your examination number"
                    type="text"
                    value={formData.examNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Check Result
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      
    </div>
  );
};

export default CheckResit;