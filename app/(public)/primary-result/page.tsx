"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { useState } from "react";

const PrimaryResult = () => {
  const [formData, setFormData] = useState({
    pinCode: "",
    serial: "",
    examNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultData(null);

    try {
      const response = await fetch(
        `/api/results?pinCode=${encodeURIComponent(formData.pinCode)}&serial=${encodeURIComponent(formData.serial)}&examNumber=${encodeURIComponent(formData.examNumber)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch result');
        console.error("Error:", data);
        return;
      }

      console.log("✅ Result fetched successfully!");
      setResultData(data);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resultData) return;
    
    setDownloadingPDF(true);
    try {
      const response = await fetch(
        `/api/results/pdf?pinCode=${encodeURIComponent(formData.pinCode)}&serial=${encodeURIComponent(formData.serial)}&examNumber=${encodeURIComponent(formData.examNumber)}`
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to generate PDF');
        return;
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Result_${resultData.examinationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to download PDF';
      setError(errorMsg);
      console.error("PDF Download Error:", err);
    } finally {
      setDownloadingPDF(false);
    }
  };

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
              <CardTitle className="text-2xl">Check Primary Result</CardTitle>
              <CardDescription>
                Enter your examination details to access your primary school results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="pinCode">Pin Code</Label>
                  <Input
                    id="pinCode"
                    placeholder="Enter your pin code"
                    type="text"
                    value={formData.pinCode}
                    onChange={handleChange}
                    required
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Fetching Result..." : "Check Result"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Result Display Card */}
          {resultData && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">Examination Result</CardTitle>
                <CardDescription>
                  Result details for {resultData.candidateName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Year</p>
                    <p className="font-medium">{resultData.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Candidate Name</p>
                    <p className="font-medium">{resultData.candidateName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sex</p>
                    <p className="font-medium">{resultData.sex || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Examination Number</p>
                    <p className="font-medium">{resultData.examinationNumber}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">School</p>
                    <p className="font-medium">{resultData.school || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Local Government Area</p>
                    <p className="font-medium">{resultData.lga || 'N/A'}</p>
                  </div>
                </div>

                {/* Grades */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Subject Grades</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">English Studies</span>
                      <span className="font-bold text-lg">{resultData.englishGrade || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Mathematics</span>
                      <span className="font-bold text-lg">{resultData.mathGrade || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">General Paper</span>
                      <span className="font-bold text-lg">{resultData.generalPaperGrade || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Christian Religious Studies</span>
                      <span className="font-bold text-lg">{resultData.crsGrade || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Remark */}
                {resultData.remark && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-1">Remark</p>
                    <p className="font-semibold text-lg px-3 py-2 bg-yellow-100 rounded-lg inline-block">
                      {resultData.remark}
                    </p>
                  </div>
                )}

                {/* Download PDF Button */}
                <div className="border-t pt-4">
                  <Button 
                    onClick={handleDownloadPDF} 
                    className="w-full"
                    disabled={downloadingPDF}
                  >
                    {downloadingPDF ? "Generating PDF..." : "Download Official Result (PDF)"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

    </div>
  );
};

export default PrimaryResult;
