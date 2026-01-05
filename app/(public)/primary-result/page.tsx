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
    accessPin: "",
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
        `/api/results?accessPin=${encodeURIComponent(formData.accessPin)}&examNumber=${encodeURIComponent(formData.examNumber)}`
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
        `/api/results/pdf?accessPin=${encodeURIComponent(formData.accessPin)}&examNumber=${encodeURIComponent(formData.examNumber)}`
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

  const formatPrintedDate = (date: Date) => {
    const d = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return d.replace(/\s/g, '-');
  };

  const handlePrint = () => {
    if (!resultData) return;

    const candidateName = [resultData.fName, resultData.mName, resultData.lName].filter(Boolean).join(' ');
    const year = resultData.sessionYr || 'N/A';
    const printedDate = formatPrintedDate(new Date());
    const logoUrl = `${window.location.origin}/delta-logo.png`;
    const passportUrl = resultData.passport || '';
    const religiousSubject = resultData.rgstype === 'IRS' 
      ? 'ISLAMIC RELIGIOUS STUDIES' 
      : resultData.rgstype === 'CRS' 
      ? 'CHRISTIAN RELIGIOUS STUDIES'
      : 'RELIGIOUS STUDIES';
    const subjects = [
      { subject: 'ENGLISH STUDIES', grade: resultData.engGrd || 'N/A' },
      { subject: 'MATHEMATICS', grade: resultData.aritGrd || 'N/A' },
      { subject: 'GENERAL PAPER', grade: resultData.gpGrd || 'N/A' },
      { subject: religiousSubject, grade: resultData.rgsGrd || 'N/A' },
    ];

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Primary Result</title>
  <style>
    @page { size: A4; margin: 12mm; }
    html, body { height: 100%; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; }
    .paper { max-width: 760px; margin: 0 auto; }
    .outer { border: 1px dotted #000; padding: 10px; }
    .inner { border: 1px solid #000; padding: 12px; }
    .center { text-align: center; }
    .title1 { font-weight: 700; font-size: 14px; letter-spacing: 0.3px; }
    .title2 { font-weight: 700; font-size: 12px; margin-top: 6px; }
    .title3 { font-weight: 700; font-size: 12px; }
    .subtitle { font-weight: 700; font-size: 12px; margin-top: 2px; }
    .logoWrap { margin: 10px 0 6px; display: flex; justify-content: center; }
    .logo { width: 74px; height: 74px; object-fit: contain; }
    .metaRow { display: flex; justify-content: space-between; gap: 16px; font-size: 12px; margin: 8px 0; padding: 6px 0; border-top: 1px dotted #999; border-bottom: 1px dotted #999; }
    .infoTable { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
    .infoTable td { padding: 6px 8px; border-bottom: 1px dotted #999; vertical-align: top; }
    .infoTable tr:last-child td { border-bottom: 0; }
    .passportPhoto { width: 100px; height: 120px; object-fit: cover; border: 1px solid #000; }
    .infoSection { display: flex; gap: 10px; align-items: flex-start; }
    .sectionBox { border: 1px solid #000; margin-top: 10px; }
    .sectionInner { padding: 8px; }
    .gradesTable { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 2px; }
    .gradesTable th { text-align: left; padding: 6px 8px; border-bottom: 1px solid #000; }
    .gradesTable td { padding: 6px 8px; border-bottom: 1px dotted #999; }
    .gradesTable tr:last-child td { border-bottom: 0; }
    .remark { font-size: 12px; margin-top: 10px; padding-top: 8px; border-top: 1px dotted #999; }
    .actions { display: flex; justify-content: center; gap: 10px; margin-top: 12px; padding-top: 8px; border-top: 1px dotted #999; }
    .btn { font-size: 12px; padding: 4px 14px; border: 1px solid #000; background: #f3f3f3; cursor: pointer; }
    .footer { margin-top: 10px; padding-top: 8px; border-top: 1px dotted #999; text-align: center; font-size: 12px; }
    .footerSmall { font-size: 11px; margin-top: 2px; }
    @media print {
      .actions { display: none !important; }
      .paper { max-width: none; }
    }
  </style>
</head>
<body>
  <div class="paper">
    <div class="outer">
      <div class="inner">
        <div class="center">
          <div class="title1">FEDERAL REPUBLIC OF NIGERIA</div>
          <div class="logoWrap"><img class="logo" src="${logoUrl}" alt="Logo" /></div>
          <div class="title2">MINISTRY OF PRIMARY EDUCATION ASABA,</div>
          <div class="title3">Delta State.</div>
          <div class="subtitle">Cognitive/Placement Certification Result</div>
        </div>

        <div class="metaRow">
          <div>Year: ${year}</div>
          <div>Date Printed: ${printedDate}</div>
        </div>

        <div class="sectionBox">
          <div class="sectionInner">
            <div class="infoSection">
              ${passportUrl ? `<img class="passportPhoto" src="${passportUrl}" alt="Passport" />` : ''}
              <table class="infoTable" style="flex: 1;">
                <tr>
                  <td>Candidate Name: ${candidateName || 'N/A'} Sex: ${resultData.sexCd || 'N/A'}</td>
                </tr>
                <tr>
                  <td>School : ${resultData.schoolName || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Local Government Area: ${resultData.lgaCd || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Examination Number: ${resultData.examinationNo || 'N/A'}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>

        <div class="sectionBox">
          <div class="sectionInner">
            <table class="gradesTable">
              <thead>
                <tr>
                  <th style="width:70%">Subject(s)</th>
                  <th style="width:30%">Grade</th>
                </tr>
              </thead>
              <tbody>
                ${subjects
                  .map(
                    (s) => `\n                <tr><td>${s.subject}</td><td>${s.grade}</td></tr>`
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="remark">Remark: ${resultData.remark || 'N/A'}</div>
          </div>
        </div>

        <div class="actions">
          <button class="btn" onclick="window.close()">Close</button>
          <button class="btn" onclick="window.print()">Print</button>
        </div>

        <div class="footer">
          <div>DELTA STATE MINISTRY OF PRIMARY EDUCATION PORTAL -</div>
          <div class="footerSmall">Powered by Ventud Limited</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    
    const printWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      setError('Popup blocked. Please allow popups to print.');
      URL.revokeObjectURL(blobUrl);
      return;
    }

    printWindow.onload = () => {
      URL.revokeObjectURL(blobUrl);
    };
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
                  <Label htmlFor="accessPin">Access Pin</Label>
                  <Input
                    id="accessPin"
                    placeholder="Enter your access pin"
                    type="text"
                    value={formData.accessPin}
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
                {/* Passport Photo */}
                {resultData.passport && (
                  <div className="flex justify-center">
                    <img 
                      src={resultData.passport} 
                      alt="Passport Photo" 
                      className="w-32 h-40 object-cover border-2 border-gray-300 rounded-lg shadow-md"
                    />
                  </div>
                )}

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
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Mathematics</span>
                        <span className="font-bold text-lg">{resultData.aritGrd || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">General Paper</span>
                        <span className="font-bold text-lg">{resultData.gpGrd || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {resultData.rgstype === 'IRS' 
                            ? 'Islamic Religious Studies' 
                            : resultData.rgstype === 'CRS' 
                            ? 'Christian Religious Studies'
                            : 'Religious Studies'}
                        </span>
                        <span className="font-bold text-lg">{resultData.rgsGrd || 'N/A'}</span>
                      </div>
                      {resultData.rgstype && (
                        <div className="text-xs text-gray-500 mt-1">Type: {resultData.rgstype}</div>
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
