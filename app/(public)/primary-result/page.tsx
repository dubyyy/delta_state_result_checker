"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, Download } from "lucide-react";
import Link from 'next/link';
import { useState } from "react";

const PrimaryResult = () => {
  const [formData, setFormData] = useState({
    pinCode: "",
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
        `/api/results?pinCode=${encodeURIComponent(formData.pinCode)}&examNumber=${encodeURIComponent(formData.examNumber)}`
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
        `/api/results/pdf?pinCode=${encodeURIComponent(formData.pinCode)}&examNumber=${encodeURIComponent(formData.examNumber)}`
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
      a.download = `Result_${resultData.examinationNo}.pdf`;
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

  const handlePrint = async () => {
    if (!resultData) return;
    
    try {
      const response = await fetch(
        `/api/results/pdf?pinCode=${encodeURIComponent(formData.pinCode)}&examNumber=${encodeURIComponent(formData.examNumber)}`
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to generate PDF');
        return;
      }

      // Open PDF in new window for printing
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        // Fallback: download if popup blocked
        const a = document.createElement('a');
        a.href = url;
        a.download = `Result_${resultData.examinationNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to print PDF';
      setError(errorMsg);
      console.error("Print Error:", err);
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
                  <Label htmlFor="pinCode">Access Pin</Label>
                  <Input
                    id="pinCode"
                    placeholder="Enter your access pin"
                    type="text"
                    value={formData.pinCode}
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
                  Result details for {[resultData.fName, resultData.mName, resultData.lName].filter(Boolean).join(' ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Year</p>
                    <p className="font-medium">{resultData.sessionYr}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Candidate Name</p>
                    <p className="font-medium">{[resultData.fName, resultData.mName, resultData.lName].filter(Boolean).join(' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sex</p>
                    <p className="font-medium">{resultData.sexCd || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Access Pin</p>
                    <p className="font-medium">{resultData.accessPin || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Examination Number</p>
                    <p className="font-medium">{resultData.examinationNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Institution Code</p>
                    <p className="font-medium">{resultData.institutionCd || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">School</p>
                    <p className="font-medium">{resultData.schoolName || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Local Government Area</p>
                    <p className="font-medium">{resultData.lgaCd || 'N/A'}</p>
                  </div>
                </div>

                {/* Grades */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Subject Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">English Studies</span>
                        <span className="font-bold text-lg">{resultData.engGrd || 'N/A'}</span>
                      </div>
                      {resultData.eng && (
                        <div className="text-xs text-gray-600 mt-1">Score: {resultData.eng}</div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Mathematics</span>
                        <span className="font-bold text-lg">{resultData.aritGrd || 'N/A'}</span>
                      </div>
                      {resultData.arit && (
                        <div className="text-xs text-gray-600 mt-1">Score: {resultData.arit}</div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">General Paper</span>
                        <span className="font-bold text-lg">{resultData.gpGrd || 'N/A'}</span>
                      </div>
                      {resultData.gp && (
                        <div className="text-xs text-gray-600 mt-1">Score: {resultData.gp}</div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Religious Studies</span>
                        <span className="font-bold text-lg">{resultData.rgsGrd || 'N/A'}</span>
                      </div>
                      {resultData.rgs && (
                        <div className="text-xs text-gray-600 mt-1">Score: {resultData.rgs}</div>
                      )}
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

                {/* Action Buttons */}
                <div className="border-t pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      onClick={handlePrint} 
                      variant="outline"
                      className="w-full"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Result
                    </Button>
                    <Button 
                      onClick={handleDownloadPDF} 
                      className="w-full"
                      disabled={downloadingPDF}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadingPDF ? "Generating..." : "Download PDF"}
                    </Button>
                  </div>
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
