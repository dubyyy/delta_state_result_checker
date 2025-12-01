"use client"
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToastProvider, useToast } from "@/hooks/use-toast";
import { CheckCircle2, Upload, FileSpreadsheet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FormData {
  year: string;
  candidateName: string;
  sex: string;
  school: string;
  lga: string;
  examinationNumber: string;
  englishGrade: string;
  mathGrade: string;
  generalPaperGrade: string;
  crsGrade: string;
  remark: string;
  pinCode: string;
  serialNumber: string;
  lgaExamNumber: string;
}

const ResultFormContent = () => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    year: "",
    candidateName: "",
    sex: "",
    school: "",
    lga: "",
    examinationNumber: "",
    englishGrade: "",
    mathGrade: "",
    generalPaperGrade: "",
    crsGrade: "",
    remark: "",
    pinCode: "",
    serialNumber: "",
    lgaExamNumber: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.candidateName || !formData.year || !formData.examinationNumber) {
      addToast({
        variant: "error",
        title: "Validation Error",
        description: "Please fill in all required fields.",
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit result');
      }

      // Show success toast with checkmark
      addToast({
        variant: "success",
        title: "Success!",
        description: data.message || 'Result submitted successfully!',
        duration: 5000,
      });

      // Reset form
      setFormData({
        year: "",
        candidateName: "",
        sex: "",
        school: "",
        lga: "",
        examinationNumber: "",
        englishGrade: "",
        mathGrade: "",
        generalPaperGrade: "",
        crsGrade: "",
        remark: "",
        pinCode: "",
        serialNumber: "",
        lgaExamNumber: "",
      });
    } catch (error) {
      addToast({
        variant: "error",
        title: "Submission Failed",
        description: error instanceof Error ? error.message : 'Failed to submit result. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        addToast({
          variant: "error",
          title: "Invalid File",
          description: "Please upload a CSV file.",
          duration: 4000,
        });
        return;
      }
      setCsvFile(file);
    }
  };

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile) {
      addToast({
        variant: "error",
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        duration: 4000,
      });
      return;
    }

    setIsUploadingCSV(true);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch('/api/results/bulk', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload CSV');
      }

      // Show success toast
      addToast({
        variant: "success",
        title: "Upload Successful!",
        description: `${data.message}. Total processed: ${data.totalProcessed}${data.errors ? `, Errors: ${data.errors.length}` : ''}`,
        duration: 7000,
      });

      // Show errors if any
      if (data.errors && data.errors.length > 0) {
        const errorDetails = data.errors.slice(0, 5).map((err: any) => 
          `Row ${err.row}: ${err.error}`
        ).join('\n');
        
        addToast({
          variant: "error",
          title: "Some Records Failed",
          description: errorDetails + (data.errors.length > 5 ? `\n...and ${data.errors.length - 5} more errors` : ''),
          duration: 10000,
        });
      }

      // Reset file input
      setCsvFile(null);
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      addToast({
        variant: "error",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload CSV. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsUploadingCSV(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Examination Results Form</h1>
          <p className="text-muted-foreground">Enter student examination details manually or upload CSV</p>
        </div>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit}>
              {/* Basic Information Section */}
              <Card className="mb-6 shadow-lg">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Student and examination details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year *</Label>
                      <Input
                        id="year"
                        type="text"
                        placeholder="e.g., 2024"
                        value={formData.year}
                        onChange={(e) => handleInputChange("year", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="candidateName">Candidate Name *</Label>
                      <Input
                        id="candidateName"
                        type="text"
                        placeholder="Full name"
                        value={formData.candidateName}
                        onChange={(e) => handleInputChange("candidateName", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sex">Sex</Label>
                      <Select value={formData.sex} onValueChange={(value) => handleInputChange("sex", value)}>
                        <SelectTrigger id="sex">
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="examinationNumber">Examination Number *</Label>
                      <Input
                        id="examinationNumber"
                        type="text"
                        placeholder="e.g., EX2024001"
                        value={formData.examinationNumber}
                        onChange={(e) => handleInputChange("examinationNumber", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="school">School</Label>
                      <Input
                        id="school"
                        type="text"
                        placeholder="School name"
                        value={formData.school}
                        onChange={(e) => handleInputChange("school", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lga">LGA</Label>
                      <Input
                        id="lga"
                        type="text"
                        placeholder="Local Government Area"
                        value={formData.lga}
                        onChange={(e) => handleInputChange("lga", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subject Grades Section */}
              <Card className="mb-6 shadow-lg">
                <CardHeader>
                  <CardTitle>Subject Grades</CardTitle>
                  <CardDescription>Enter grades for each subject</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="englishGrade">English Studies</Label>
                      <Input
                        id="englishGrade"
                        type="text"
                        placeholder="e.g., A, B, C"
                        value={formData.englishGrade}
                        onChange={(e) => handleInputChange("englishGrade", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mathGrade">Mathematics</Label>
                      <Input
                        id="mathGrade"
                        type="text"
                        placeholder="e.g., A, B, C"
                        value={formData.mathGrade}
                        onChange={(e) => handleInputChange("mathGrade", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="generalPaperGrade">General Paper</Label>
                      <Input
                        id="generalPaperGrade"
                        type="text"
                        placeholder="e.g., A, B, C"
                        value={formData.generalPaperGrade}
                        onChange={(e) => handleInputChange("generalPaperGrade", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="crsGrade">Christian Religious Studies</Label>
                      <Input
                        id="crsGrade"
                        type="text"
                        placeholder="e.g., A, B, C"
                        value={formData.crsGrade}
                        onChange={(e) => handleInputChange("crsGrade", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remark Section */}
              <Card className="mb-6 shadow-lg">
                <CardHeader>
                  <CardTitle>Remark</CardTitle>
                  <CardDescription>Additional comments or observations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="remark">Remark</Label>
                    <Textarea
                      id="remark"
                      placeholder="Enter any remarks or comments"
                      value={formData.remark}
                      onChange={(e) => handleInputChange("remark", e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6 shadow-lg">
                <CardHeader>
                  <CardTitle>LGA Data</CardTitle>
                  <CardDescription>Local Government Area specific information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pinCode">Pin Code</Label>
                      <Input
                        id="pinCode"
                        type="text"
                        placeholder="Enter pin code"
                        value={formData.pinCode}
                        onChange={(e) => handleInputChange("pinCode", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        type="text"
                        placeholder="Enter serial number"
                        value={formData.serialNumber}
                        onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lgaExamNumber">LGA Examination No.</Label>
                      <Input
                        id="lgaExamNumber"
                        type="text"
                        placeholder="Enter LGA examination number"
                        value={formData.lgaExamNumber}
                        onChange={(e) => handleInputChange("lgaExamNumber", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full md:w-auto px-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Results'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="csv">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Bulk Upload via CSV
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with student results. The file must include the following columns:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* CSV Format Info */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Required CSV Format:</h3>
                    <code className="text-xs block overflow-x-auto">
                      SESSIONYR, FNAME, MNAME, LNAME, SEXCD, INSTITUTIONCD, SCHOOLNAME, LGACD, EXAMINATIONNO, ENG, ENGGRD, ARIT, ARITGRD, GP, GPGRD, RGS, RGSGRD, REMARK, ACCCESS_PIN
                    </code>
                  </div>

                  <form onSubmit={handleCSVUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="csv-file">Select CSV File</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="csv-file"
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                        {csvFile && (
                          <span className="text-sm text-muted-foreground">
                            {csvFile.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full md:w-auto px-12"
                        disabled={!csvFile || isUploadingCSV}
                      >
                        {isUploadingCSV ? (
                          'Uploading...'
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload CSV
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Instructions */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Instructions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Ensure your CSV file follows the exact format shown above</li>
                      <li>All examination numbers must be unique</li>
                      <li>Required fields: SESSIONYR, EXAMINATIONNO, and at least one name field</li>
                      <li>The system will skip duplicate examination numbers</li>
                      <li>Any errors will be reported after upload</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ResultForm = () => {
  return (
    <ToastProvider>
      <ResultFormContent />
    </ToastProvider>
  );
};

export default ResultForm;