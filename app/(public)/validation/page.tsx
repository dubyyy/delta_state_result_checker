"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Edit, Printer, X, Search } from "lucide-react";
import { useState, useEffect } from "react";
import Link from 'next/link';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface StudentRegistration {
  id: string;
  studentNumber: string;
  firstname: string;
  othername: string;
  lastname: string;
  gender: string;
  schoolType: string;
  passport: string | null;
  englishTerm1: string;
  englishTerm2: string;
  englishTerm3: string;
  arithmeticTerm1: string;
  arithmeticTerm2: string;
  arithmeticTerm3: string;
  generalTerm1: string;
  generalTerm2: string;
  generalTerm3: string;
  religiousType: string;
  religiousTerm1: string;
  religiousTerm2: string;
  religiousTerm3: string;
  createdAt: string;
}

// LGA options
const LGAS = [
  { name: "ANIOCHA-NORTH", code: "1420256700" },
  { name: "ANIOCHA-SOUTH", code: "660742704" },
  { name: "BOMADI", code: "99763601" },
  { name: "BURUTU", code: "1830665512" },
  { name: "ETHIOPE-EAST", code: "88169935" },
  { name: "ETHIOPE-WEST", code: "87907773" },
  { name: "IKA NORTH-EAST", code: "2077558841" },
  { name: "IKA-SOUTH", code: "1918656250" },
  { name: "ISOKO-NORTH", code: "1583401849" },
  { name: "ISOKO-SOUTH", code: "1159914347" },
  { name: "NDOKWA-EAST", code: "90249440" },
  { name: "NDOKWA-WEST", code: "1784211236" },
  { name: "OKPE", code: "653025957" },
  { name: "OSHIMILI-NORTH", code: "1865127727" },
  { name: "OSHIMILI-SOUTH", code: "1561094353" },
  { name: "PATANI", code: "1313680994" },
  { name: "SAPELE", code: "1776329831" },
  { name: "UDU", code: "435624852" },
  { name: "UGHELLI-NORTH", code: "1118545377" },
  { name: "UGHELLI-SOUTH", code: "803769815" },
  { name: "UKWUANI", code: "1916789388" },
  { name: "UVWIE", code: "1835037667" },
  { name: "WARRI-NORTH", code: "580987670" },
  { name: "WARRI-SOUTH", code: "1031892114" },
  { name: "WARRI-SOUTH-WEST", code: "1563044454" },
];

function formatLgaLabel(name: string) {
  return name
    .toLowerCase()
    .split(/[-\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const Validation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [lgaCode, setLgaCode] = useState<string>("");
  const [schoolCode, setSchoolCode] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSignupMode, setIsSignupMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");
  const [authenticatedSchool, setAuthenticatedSchool] = useState<string>("");
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>("");
  const [editingStudent, setEditingStudent] = useState<StudentRegistration | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<StudentRegistration | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Check for existing JWT token on component mount
  useEffect(() => {
    const token = localStorage.getItem('schoolToken');
    const schoolData = localStorage.getItem('schoolData');
    
    if (token && schoolData) {
      try {
        const school = JSON.parse(schoolData);
        setIsLoggedIn(true);
        setAuthenticatedSchool(school.schoolName);
        setLgaCode(school.lgaCode);
        setSchoolCode(school.schoolCode);
      } catch (error) {
        console.error('Error parsing school data:', error);
        localStorage.removeItem('schoolToken');
        localStorage.removeItem('schoolData');
      }
    }
  }, []);

  // Fetch registrations when logged in
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!isLoggedIn) {
        setRegistrations([]);
        return;
      }

      setIsFetchingData(true);
      setFetchError("");

      try {
        const token = localStorage.getItem('schoolToken');
        if (!token) {
          setFetchError('Authentication token not found. Please login again.');
          return;
        }

        const response = await fetch('/api/school/registrations', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setFetchError(data.error || 'Failed to fetch registrations');
          return;
        }

        setRegistrations(data.registrations || []);
      } catch (error) {
        console.error('Fetch error:', error);
        setFetchError('An error occurred while fetching data. Please try again.');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchRegistrations();
  }, [isLoggedIn]);

  const handleEdit = (student: StudentRegistration) => {
    setEditingStudent(student);
    setEditFormData({ ...student });
    setIsEditModalOpen(true);
    setEditError("");
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
    setEditFormData(null);
    setEditError("");
  };

  const handleEditFormChange = (field: keyof StudentRegistration, value: string) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editFormData) return;

    setIsSavingEdit(true);
    setEditError("");

    try {
      const token = localStorage.getItem('schoolToken');
      if (!token) {
        setEditError('Authentication token not found. Please login again.');
        setIsSavingEdit(false);
        return;
      }

      console.log('Updating student:', editFormData.id);
      console.log('Request data:', editFormData);

      const response = await fetch(`/api/school/registrations/${editFormData.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        const errorMessage = data.error || `Failed to update student (Status: ${response.status}). Please try again.`;
        setEditError(errorMessage);
        setIsSavingEdit(false);
        return;
      }

      // Update the local registrations state
      setRegistrations(prevRegs => 
        prevRegs.map(reg => reg.id === editFormData.id ? editFormData : reg)
      );

      console.log('Student updated successfully');
      handleCloseEditModal();
    } catch (error) {
      console.error('Edit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating student.';
      setEditError(`Network error: ${errorMessage}. Please check your connection and try again.`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePrint = (student: StudentRegistration) => {
    // Create a printable view of the student data
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Student Registration - ${student.studentNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .info-row { margin: 10px 0; display: flex; }
              .label { font-weight: bold; width: 200px; }
              .value { flex: 1; }
              .section { margin-top: 20px; }
              .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #555; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <h1>Student Registration Details</h1>
            <div class="section">
              <div class="section-title">Personal Information</div>
              <div class="info-row"><span class="label">Student Number:</span><span class="value">${student.studentNumber}</span></div>
              <div class="info-row"><span class="label">Full Name:</span><span class="value">${student.lastname} ${student.othername} ${student.firstname}</span></div>
              <div class="info-row"><span class="label">Gender:</span><span class="value">${student.gender}</span></div>
              <div class="info-row"><span class="label">School Type:</span><span class="value">${student.schoolType}</span></div>
              <div class="info-row"><span class="label">Religious Type:</span><span class="value">${student.religiousType || 'N/A'}</span></div>
              <div class="info-row"><span class="label">Registration Date:</span><span class="value">${new Date(student.createdAt).toLocaleDateString()}</span></div>
            </div>
            <div class="section">
              <div class="section-title">Academic Scores</div>
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Term 1</th>
                    <th>Term 2</th>
                    <th>Term 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>English</td>
                    <td>${student.englishTerm1}</td>
                    <td>${student.englishTerm2}</td>
                    <td>${student.englishTerm3}</td>
                  </tr>
                  <tr>
                    <td>Arithmetic</td>
                    <td>${student.arithmeticTerm1}</td>
                    <td>${student.arithmeticTerm2}</td>
                    <td>${student.arithmeticTerm3}</td>
                  </tr>
                  <tr>
                    <td>General Knowledge</td>
                    <td>${student.generalTerm1}</td>
                    <td>${student.generalTerm2}</td>
                    <td>${student.generalTerm3}</td>
                  </tr>
                  <tr>
                    <td>Religious Studies</td>
                    <td>${student.religiousTerm1}</td>
                    <td>${student.religiousTerm2}</td>
                    <td>${student.religiousTerm3}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background-color: #333; color: white; border: none; cursor: pointer; border-radius: 5px;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; background-color: #666; color: white; border: none; cursor: pointer; border-radius: 5px; margin-left: 10px;">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const handlePrintAll = async () => {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

      // Page dimensions
      const pageWidth = 595; // A4 width in points
      const pageHeight = 842; // A4 height in points
      const margin = 50;
      const tableWidth = pageWidth - 2 * margin;
      
      // Column widths
      const colSN = 40;
      const colExamNo = 90;
      const colNames = tableWidth - colSN - colExamNo - 60;
      const colSex = 60;

      // Table settings
      const rowHeight = 20;
      const headerHeight = 25;
      let currentY = pageHeight - margin;
      let page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Function to check if new page is needed
      const checkNewPage = () => {
        if (currentY < margin + rowHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
          drawTableHeader();
        }
      };

      // Function to draw table header
      const drawTableHeader = () => {
        // Header background
        page.drawRectangle({
          x: margin,
          y: currentY - headerHeight,
          width: tableWidth,
          height: headerHeight,
          color: rgb(0.95, 0.95, 0.95),
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        // Draw column borders
        page.drawLine({
          start: { x: margin + colSN, y: currentY },
          end: { x: margin + colSN, y: currentY - headerHeight },
          thickness: 1,
        });
        page.drawLine({
          start: { x: margin + colSN + colExamNo, y: currentY },
          end: { x: margin + colSN + colExamNo, y: currentY - headerHeight },
          thickness: 1,
        });
        page.drawLine({
          start: { x: margin + colSN + colExamNo + colNames, y: currentY },
          end: { x: margin + colSN + colExamNo + colNames, y: currentY - headerHeight },
          thickness: 1,
        });

        // Header text
        page.drawText('S/N', {
          x: margin + 10,
          y: currentY - 17,
          size: 11,
          font: timesRomanBoldFont,
        });
        page.drawText('EXAM NO.', {
          x: margin + colSN + 5,
          y: currentY - 17,
          size: 11,
          font: timesRomanBoldFont,
        });
        page.drawText('NAMES', {
          x: margin + colSN + colExamNo + 5,
          y: currentY - 17,
          size: 11,
          font: timesRomanBoldFont,
        });
        page.drawText('SEX', {
          x: margin + colSN + colExamNo + colNames + 15,
          y: currentY - 17,
          size: 11,
          font: timesRomanBoldFont,
        });

        currentY -= headerHeight;
      };

      // Draw initial header
      drawTableHeader();

      // Draw table rows
      registrations.forEach((student, index) => {
        checkNewPage();

        // Row background (alternating)
        if (index % 2 === 0) {
          page.drawRectangle({
            x: margin,
            y: currentY - rowHeight,
            width: tableWidth,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.98),
          });
        }

        // Row border
        page.drawRectangle({
          x: margin,
          y: currentY - rowHeight,
          width: tableWidth,
          height: rowHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        // Draw column borders
        page.drawLine({
          start: { x: margin + colSN, y: currentY },
          end: { x: margin + colSN, y: currentY - rowHeight },
          thickness: 1,
        });
        page.drawLine({
          start: { x: margin + colSN + colExamNo, y: currentY },
          end: { x: margin + colSN + colExamNo, y: currentY - rowHeight },
          thickness: 1,
        });
        page.drawLine({
          start: { x: margin + colSN + colExamNo + colNames, y: currentY },
          end: { x: margin + colSN + colExamNo + colNames, y: currentY - rowHeight },
          thickness: 1,
        });

        // Full name
        const fullName = `${student.lastname.toUpperCase()} ${student.othername.toUpperCase()} ${student.firstname.toUpperCase()}`;
        
        // Row text
        page.drawText(`${index + 1}`, {
          x: margin + 10,
          y: currentY - 14,
          size: 10,
          font: timesRomanFont,
        });
        page.drawText(student.studentNumber, {
          x: margin + colSN + 5,
          y: currentY - 14,
          size: 10,
          font: timesRomanFont,
        });
        
        // Truncate name if too long
        const maxNameWidth = colNames - 10;
        let nameToDisplay = fullName;
        let nameWidth = timesRomanFont.widthOfTextAtSize(nameToDisplay, 10);
        
        while (nameWidth > maxNameWidth && nameToDisplay.length > 0) {
          nameToDisplay = nameToDisplay.slice(0, -1);
          nameWidth = timesRomanFont.widthOfTextAtSize(nameToDisplay + '...', 10);
        }
        
        if (nameToDisplay !== fullName) {
          nameToDisplay += '...';
        }
        
        page.drawText(nameToDisplay, {
          x: margin + colSN + colExamNo + 5,
          y: currentY - 14,
          size: 10,
          font: timesRomanFont,
        });
        
        page.drawText(student.gender.charAt(0).toUpperCase(), {
          x: margin + colSN + colExamNo + colNames + 20,
          y: currentY - 14,
          size: 10,
          font: timesRomanFont,
        });

        currentY -= rowHeight;
      });

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create a blob and download
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-validation-${authenticatedSchool.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/school/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lgaCode, schoolCode, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || 'Signup failed. Please try again.');
        return;
      }

      // Store JWT token and school data
      localStorage.setItem('schoolToken', data.token);
      localStorage.setItem('schoolData', JSON.stringify(data.school));
      
      // Auto login after signup
      setIsLoggedIn(true);
      setAuthenticatedSchool(data.school.schoolName);
    } catch (error) {
      console.error('Signup error:', error);
      setLoginError('An error occurred during signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/school/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lgaCode, schoolCode, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || 'Login failed. Please try again.');
        return;
      }

      // Store JWT token and school data
      localStorage.setItem('schoolToken', data.token);
      localStorage.setItem('schoolData', JSON.stringify(data.school));
      
      // Login successful
      setIsLoggedIn(true);
      setAuthenticatedSchool(data.school.schoolName);
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {isLoggedIn ? "Student Registrations" : (isSignupMode ? "School Signup" : "School Login")}
                  </CardTitle>
                  <CardDescription>
                    {isLoggedIn 
                      ? <>All registered students for <strong>{authenticatedSchool}</strong></>
                      : (isSignupMode 
                        ? "Create an account to access student registration data"
                        : "Please login with your LGA and school code to view student registrations")}
                  </CardDescription>
                </div>
                {isLoggedIn && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsLoggedIn(false);
                      setLgaCode("");
                      setSchoolCode("");
                      setAuthenticatedSchool("");
                      setLoginError("");
                      setPassword("");
                      localStorage.removeItem('schoolToken');
                      localStorage.removeItem('schoolData');
                    }}
                  >
                    Logout
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isLoggedIn ? (
                // Login/Signup Form
                <form className="space-y-6" onSubmit={isSignupMode ? handleSignup : handleLogin}>
                  {loginError && (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {loginError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="lga">Local Government Area (LGA)</Label>
                    <Select value={lgaCode} onValueChange={setLgaCode} required>
                      <SelectTrigger id="lga">
                        <SelectValue placeholder="Select your LGA" />
                      </SelectTrigger>
                      <SelectContent>
                        {LGAS.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {formatLgaLabel(item.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolCode">School Code</Label>
                    <Input
                      id="schoolCode"
                      name="schoolCode"
                      type="text"
                      placeholder="Enter your school code"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder={isSignupMode ? "Create a password (minimum 6 characters)" : "Enter your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (isSignupMode ? "Signing up..." : "Logging in...") : (isSignupMode ? "Sign Up" : "Login")}
                  </Button>

                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">
                      {isSignupMode ? "Already have an account? " : "Don't have an account? "}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignupMode(!isSignupMode);
                        setLoginError("");
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      {isSignupMode ? "Login here" : "Sign up here"}
                    </button>
                  </div>
                </form>
              ) : (
                // Student Registrations Table
                <div>
                {isFetchingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading registrations...</span>
                  </div>
                ) : fetchError ? (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {fetchError}
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No student registrations found. Students registered in the school-registration page will appear here.
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const filteredRegistrations = registrations.filter((student) => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        const fullName = `${student.lastname} ${student.othername} ${student.firstname}`.toLowerCase();
                        return (
                          student.studentNumber.toLowerCase().includes(query) ||
                          fullName.includes(query) ||
                          student.gender.toLowerCase().includes(query) ||
                          student.schoolType.toLowerCase().includes(query) ||
                          student.religiousType.toLowerCase().includes(query)
                        );
                      });

                      return (
                        <>
                          <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="flex-1 relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search by student number, name, gender, or school type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={handlePrintAll}
                                variant="outline"
                                className="gap-2 whitespace-nowrap"
                              >
                                <Printer className="h-4 w-4" />
                                Print All
                              </Button>
                            </div>
                          </div>
                          
                          {searchQuery && (
                            <div className="mb-3 text-sm text-muted-foreground">
                              {filteredRegistrations.length === 0 ? (
                                <span>No results found for "{searchQuery}"</span>
                              ) : (
                                <span>Showing {filteredRegistrations.length} of {registrations.length} student{filteredRegistrations.length !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          )}

                          {filteredRegistrations.length === 0 && searchQuery ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No students match your search. Try adjusting your search terms.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Student Number</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Gender</TableHead>
                                    <TableHead>School Type</TableHead>
                                    <TableHead>English</TableHead>
                                    <TableHead>Arithmetic</TableHead>
                                    <TableHead>General</TableHead>
                                    <TableHead>Religious</TableHead>
                                    <TableHead>Date Added</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredRegistrations.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.studentNumber}</TableCell>
                              <TableCell>
                                {student.lastname} {student.othername} {student.firstname}
                              </TableCell>
                              <TableCell className="capitalize">{student.gender}</TableCell>
                              <TableCell className="capitalize">{student.schoolType}</TableCell>
                              <TableCell>
                                <div className="text-xs">
                                  T1: {student.englishTerm1}, T2: {student.englishTerm2}, T3: {student.englishTerm3}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs">
                                  T1: {student.arithmeticTerm1}, T2: {student.arithmeticTerm2}, T3: {student.arithmeticTerm3}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs">
                                  T1: {student.generalTerm1}, T2: {student.generalTerm2}, T3: {student.generalTerm3}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs">
                                  <div className="font-medium capitalize">{student.religiousType || 'N/A'}</div>
                                  T1: {student.religiousTerm1}, T2: {student.religiousTerm2}, T3: {student.religiousTerm3}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs">
                                {new Date(student.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(student)}
                                    className="h-8 w-8 p-0"
                                    title="Edit Student"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePrint(student)}
                                    className="h-8 w-8 p-0"
                                    title="Print Student Details"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Student Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student Registration</DialogTitle>
            <DialogDescription>
              Update student information for {editFormData?.studentNumber}
            </DialogDescription>
          </DialogHeader>
          
          {editError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {editError}
            </div>
          )}

          {editFormData && (
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstname">First Name</Label>
                    <Input
                      id="edit-firstname"
                      value={editFormData.firstname}
                      onChange={(e) => handleEditFormChange('firstname', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-othername">Other Name</Label>
                    <Input
                      id="edit-othername"
                      value={editFormData.othername}
                      onChange={(e) => handleEditFormChange('othername', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastname">Last Name</Label>
                    <Input
                      id="edit-lastname"
                      value={editFormData.lastname}
                      onChange={(e) => handleEditFormChange('lastname', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-gender">Gender</Label>
                    <Select value={editFormData.gender} onValueChange={(value) => handleEditFormChange('gender', value)}>
                      <SelectTrigger id="edit-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-schoolType">School Type</Label>
                    <Select value={editFormData.schoolType} onValueChange={(value) => handleEditFormChange('schoolType', value)}>
                      <SelectTrigger id="edit-schoolType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-religiousType">Religious Type</Label>
                    <Select value={editFormData.religiousType} onValueChange={(value) => handleEditFormChange('religiousType', value)}>
                      <SelectTrigger id="edit-religiousType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="christian">Christian</SelectItem>
                        <SelectItem value="islamic">Islamic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* English Scores Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">English Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-englishTerm1">Term 1</Label>
                    <Input
                      id="edit-englishTerm1"
                      type="number"
                      value={editFormData.englishTerm1}
                      onChange={(e) => handleEditFormChange('englishTerm1', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-englishTerm2">Term 2</Label>
                    <Input
                      id="edit-englishTerm2"
                      type="number"
                      value={editFormData.englishTerm2}
                      onChange={(e) => handleEditFormChange('englishTerm2', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-englishTerm3">Term 3</Label>
                    <Input
                      id="edit-englishTerm3"
                      type="number"
                      value={editFormData.englishTerm3}
                      onChange={(e) => handleEditFormChange('englishTerm3', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Arithmetic Scores Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Arithmetic Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-arithmeticTerm1">Term 1</Label>
                    <Input
                      id="edit-arithmeticTerm1"
                      type="number"
                      value={editFormData.arithmeticTerm1}
                      onChange={(e) => handleEditFormChange('arithmeticTerm1', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-arithmeticTerm2">Term 2</Label>
                    <Input
                      id="edit-arithmeticTerm2"
                      type="number"
                      value={editFormData.arithmeticTerm2}
                      onChange={(e) => handleEditFormChange('arithmeticTerm2', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-arithmeticTerm3">Term 3</Label>
                    <Input
                      id="edit-arithmeticTerm3"
                      type="number"
                      value={editFormData.arithmeticTerm3}
                      onChange={(e) => handleEditFormChange('arithmeticTerm3', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* General Knowledge Scores Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">General Knowledge Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-generalTerm1">Term 1</Label>
                    <Input
                      id="edit-generalTerm1"
                      type="number"
                      value={editFormData.generalTerm1}
                      onChange={(e) => handleEditFormChange('generalTerm1', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-generalTerm2">Term 2</Label>
                    <Input
                      id="edit-generalTerm2"
                      type="number"
                      value={editFormData.generalTerm2}
                      onChange={(e) => handleEditFormChange('generalTerm2', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-generalTerm3">Term 3</Label>
                    <Input
                      id="edit-generalTerm3"
                      type="number"
                      value={editFormData.generalTerm3}
                      onChange={(e) => handleEditFormChange('generalTerm3', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Religious Studies Scores Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Religious Studies Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-religiousTerm1">Term 1</Label>
                    <Input
                      id="edit-religiousTerm1"
                      type="number"
                      value={editFormData.religiousTerm1}
                      onChange={(e) => handleEditFormChange('religiousTerm1', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-religiousTerm2">Term 2</Label>
                    <Input
                      id="edit-religiousTerm2"
                      type="number"
                      value={editFormData.religiousTerm2}
                      onChange={(e) => handleEditFormChange('religiousTerm2', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-religiousTerm3">Term 3</Label>
                    <Input
                      id="edit-religiousTerm3"
                      type="number"
                      value={editFormData.religiousTerm3}
                      onChange={(e) => handleEditFormChange('religiousTerm3', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Validation;
