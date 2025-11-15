"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Upload, Edit2, Save, X, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from 'next/link';
import schoolsData from '@/data.json';

interface SchoolData {
  lgaCode: string;
  lCode: string;
  schCode: string;
  progID: string;
  schName: string;
  id: string;
}

interface Registration {
  id: number;
  studentNumber: string;
  lastname: string;
  othername: string;
  firstname: string;
  gender: string;
  schoolType: string;
  passport: string | null;
  english: { term1: string; term2: string; term3: string };
  arithmetic: { term1: string; term2: string; term3: string };
  general: { term1: string; term2: string; term3: string };
  religious: { term1: string; term2: string; term3: string; type: string };
}

// LGA options: label = name, value = code
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
  // Convert e.g. "ANIOCHA-NORTH" -> "Aniocha North"
  return name
    .toLowerCase()
    .split(/[-\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const SchoolRegistration = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [lgaCode, setLgaCode] = useState<string>("");
  const [schoolCode, setSchoolCode] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [gender, setGender] = useState<string>("");
  const [schoolType, setSchoolType] = useState<string>("");
  const [religiousType, setReligiousType] = useState<string>("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Registration | null>(null);
  const [loginError, setLoginError] = useState<string>("");
  const [authenticatedSchool, setAuthenticatedSchool] = useState<string>("");
  const [studentCounter, setStudentCounter] = useState<number>(1);
  const [password, setPassword] = useState<string>("");
  const [isSignupMode, setIsSignupMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  // Generate student number: xfffmmmm format
  const generateStudentNumber = (lgaCode: string, schoolCode: string, counter: number): string => {
    // Find the actual school data to get lgaCode
    const schools = schoolsData as SchoolData[];
    const school = schools.find(
      (s) => s.lCode === lgaCode && s.schCode === schoolCode
    );
    
    if (!school) return '';
    
    const x = school.lgaCode; // 1-2 digits
    const fff = school.schCode.padStart(3, '0'); // 3 digits (padded)
    const mmmm = counter.toString().padStart(4, '0'); // 4 digits (padded)
    
    return `${x}${fff}${mmmm}`;
  };

  // Helper function to limit score input to 2 digits
  const handleScoreInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = input.value;
    if (value.length > 2) {
      input.value = value.slice(0, 2);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {isLoggedIn ? "Primary School Registration" : (isSignupMode ? "School Signup" : "School Login")}
                  </CardTitle>
                  <CardDescription>
                    {isLoggedIn 
                      ? <>Register new students for <strong>{authenticatedSchool}</strong></>
                      : (isSignupMode 
                        ? "Create an account to access the registration system"
                        : "Please login with your LGA and school code to access registration")}
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
                // Registration Form
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  
                  // Generate student number
                  const studentNumber = generateStudentNumber(lgaCode, schoolCode, studentCounter);
                  
                  const newRegistration: Registration = {
                    id: Date.now(),
                    studentNumber: studentNumber,
                    lastname: formData.get('lastname') as string,
                    othername: formData.get('othername') as string,
                    firstname: formData.get('firstname') as string,
                    gender: gender,
                    schoolType: schoolType,
                    passport: selectedImage,
                    english: {
                      term1: formData.get('english-term1') as string || '-',
                      term2: formData.get('english-term2') as string || '-',
                      term3: formData.get('english-term3') as string || '-',
                    },
                    arithmetic: {
                      term1: formData.get('arithmetic-term1') as string || '-',
                      term2: formData.get('arithmetic-term2') as string || '-',
                      term3: formData.get('arithmetic-term3') as string || '-',
                    },
                    general: {
                      term1: formData.get('general-term1') as string || '-',
                      term2: formData.get('general-term2') as string || '-',
                      term3: formData.get('general-term3') as string || '-',
                    },
                    religious: {
                      term1: formData.get('religious-term1') as string || '-',
                      term2: formData.get('religious-term2') as string || '-',
                      term3: formData.get('religious-term3') as string || '-',
                      type: religiousType,
                    },
                  };
                  
                  setRegistrations([...registrations, newRegistration]);
                  setStudentCounter(studentCounter + 1); // Increment counter
                  e.currentTarget.reset();
                  setSelectedImage(null);
                  setGender("");
                  setSchoolType("");
                  setReligiousType("");
                }}>
                <div className="space-y-2">
                  <Label htmlFor="lastname">Lastname/Surname</Label>
                  <Input
                    id="lastname"
                    name="lastname"
                    placeholder="Enter lastname"
                    type="text"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="othername">Other Name/Middlename</Label>
                  <Input
                    id="othername"
                    name="othername"
                    placeholder="Enter other name or middlename"
                    type="text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input
                    id="firstname"
                    name="firstname"
                    placeholder="Enter first name"
                    type="text"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender} required>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolType">School Type</Label>
                  <Select value={schoolType} onValueChange={setSchoolType} required>
                    <SelectTrigger id="schoolType">
                      <SelectValue placeholder="Select school type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public School</SelectItem>
                      <SelectItem value="private">Private School</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Upload Passport</Label>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {selectedImage && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <img
                          src={selectedImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Continuous Assessment Section */}
                <div className="space-y-6 pt-6 border-t">
                  <div>
                    <h3 className="text-lg font-semibold">Continuous Assessment</h3>
                    <p className="text-sm text-muted-foreground">Enter assessment scores for each term (Optional)</p>
                  </div>
                  
                  {/* English */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">English</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="english-term1" className="text-sm">First Term</Label>
                        <Input
                          id="english-term1"
                          name="english-term1"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="english-term2" className="text-sm">Second Term</Label>
                        <Input
                          id="english-term2"
                          name="english-term2"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="english-term3" className="text-sm">Third Term</Label>
                        <Input
                          id="english-term3"
                          name="english-term3"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Arithmetic */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Arithmetic</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="arithmetic-term1" className="text-sm">First Term</Label>
                        <Input
                          id="arithmetic-term1"
                          name="arithmetic-term1"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="arithmetic-term2" className="text-sm">Second Term</Label>
                        <Input
                          id="arithmetic-term2"
                          name="arithmetic-term2"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="arithmetic-term3" className="text-sm">Third Term</Label>
                        <Input
                          id="arithmetic-term3"
                          name="arithmetic-term3"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                    </div>
                  </div>

                  {/* General Paper */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">General Paper</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="general-term1" className="text-sm">First Term</Label>
                        <Input
                          id="general-term1"
                          name="general-term1"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="general-term2" className="text-sm">Second Term</Label>
                        <Input
                          id="general-term2"
                          name="general-term2"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="general-term3" className="text-sm">Third Term</Label>
                        <Input
                          id="general-term3"
                          name="general-term3"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Religious Studies */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Label className="text-base font-medium">Religious Studies</Label>
                      <Select value={religiousType} onValueChange={setReligiousType}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="islam">Islamic Studies</SelectItem>
                          <SelectItem value="christian">Christian Religious Studies</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="religious-term1" className="text-sm">First Term</Label>
                        <Input
                          id="religious-term1"
                          name="religious-term1"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="religious-term2" className="text-sm">Second Term</Label>
                        <Input
                          id="religious-term2"
                          name="religious-term2"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="religious-term3" className="text-sm">Third Term</Label>
                        <Input
                          id="religious-term3"
                          name="religious-term3"
                          placeholder="0-99"
                          type="number"
                          min="0"
                          max="99"
                          onInput={handleScoreInput}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Submit Registration
                </Button>
              </form>
              )}
            </CardContent>
          </Card>

          {/* Registered Students Table */}
          {isLoggedIn && registrations.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registered Students</CardTitle>
                    <CardDescription>
                      {registrations.length} student{registrations.length !== 1 ? 's' : ''} registered
                    </CardDescription>
                  </div>
                  <Button
                    onClick={async () => {
                      setIsSaving(true);
                      setSaveMessage(null);
                      
                      try {
                        const token = localStorage.getItem('schoolToken');
                        
                        if (!token) {
                          setSaveMessage({ type: 'error', text: 'Authentication token not found. Please login again.' });
                          return;
                        }
                        
                        const response = await fetch('/api/school/registrations', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ registrations }),
                        });
                        
                        const data = await response.json();
                        
                        if (!response.ok) {
                          setSaveMessage({ type: 'error', text: data.error || 'Failed to save registrations' });
                          return;
                        }
                        
                        setSaveMessage({ type: 'success', text: `Successfully saved ${data.count} registration(s) to the database!` });
                        
                        // Auto-dismiss success message after 5 seconds
                        setTimeout(() => {
                          setSaveMessage(null);
                        }, 5000);
                        
                        // Clear registrations after successful save
                        setRegistrations([]);
                        setStudentCounter(1);
                      } catch (error) {
                        console.error('Save error:', error);
                        setSaveMessage({ type: 'error', text: 'An error occurred while saving. Please try again.' });
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Data'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {saveMessage && (
                  <div className={`mb-6 overflow-hidden rounded-xl transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-top-4 ${
                    saveMessage.type === 'success' 
                      ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200/60' 
                      : 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-2 border-red-200/60'
                  }`}>
                    <div className="relative p-6">
                      {/* Decorative background pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${
                          saveMessage.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                        }`} />
                        <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl ${
                          saveMessage.type === 'success' ? 'bg-teal-400' : 'bg-rose-400'
                        }`} />
                      </div>
                      
                      {/* Content */}
                      <div className="relative flex items-start gap-4">
                        {/* Icon with animated background */}
                        <div className={`shrink-0 relative ${
                          saveMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          <div className={`absolute inset-0 rounded-full blur-md opacity-40 animate-pulse ${
                            saveMessage.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                          }`} />
                          <div className={`relative flex items-center justify-center w-12 h-12 rounded-full ${
                            saveMessage.type === 'success' 
                              ? 'bg-emerald-100 ring-4 ring-emerald-200/50' 
                              : 'bg-red-100 ring-4 ring-red-200/50'
                          }`}>
                            {saveMessage.type === 'success' ? (
                              <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
                            ) : (
                              <AlertCircle className="h-6 w-6" strokeWidth={2.5} />
                            )}
                          </div>
                        </div>
                        
                        {/* Text content */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-xl mb-2 tracking-tight ${
                            saveMessage.type === 'success' ? 'text-emerald-900' : 'text-red-900'
                          }`}>
                            {saveMessage.type === 'success' ? '✨ Successfully Saved!' : '⚠️ Error Occurred'}
                          </h3>
                          <p className={`text-base leading-relaxed ${
                            saveMessage.type === 'success' ? 'text-emerald-800/90' : 'text-red-800/90'
                          }`}>
                            {saveMessage.text}
                          </p>
                          {saveMessage.type === 'success' && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700/80">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-medium">All data has been securely stored</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Close button */}
                        <button
                          onClick={() => setSaveMessage(null)}
                          className={`shrink-0 rounded-lg p-2 transition-all duration-200 hover:scale-110 ${
                            saveMessage.type === 'success' 
                              ? 'hover:bg-emerald-200/50 text-emerald-700 hover:text-emerald-800' 
                              : 'hover:bg-red-200/50 text-red-700 hover:text-red-800'
                          }`}
                          aria-label="Close notification"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Photo</TableHead>
                        <TableHead>Student Number</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>School Type</TableHead>
                        <TableHead>English (T1/T2/T3)</TableHead>
                        <TableHead>Arithmetic (T1/T2/T3)</TableHead>
                        <TableHead>General Paper (T1/T2/T3)</TableHead>
                        <TableHead>Religious Studies (T1/T2/T3)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((reg) => {
                        const isEditing = editingId === reg.id;
                        const currentData = isEditing && editData ? editData : reg;
                        
                        return (
                          <TableRow key={reg.id}>
                            <TableCell>
                              {reg.passport ? (
                                <img
                                  src={reg.passport}
                                  alt="Student"
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xs">
                                  No Photo
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-sm font-semibold">{reg.studentNumber}</div>
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="space-y-1">
                                  <Input
                                    value={currentData.firstname}
                                    onChange={(e) => setEditData({...currentData, firstname: e.target.value})}
                                    className="h-8"
                                    placeholder="First name"
                                  />
                                  <Input
                                    value={currentData.othername}
                                    onChange={(e) => setEditData({...currentData, othername: e.target.value})}
                                    className="h-8"
                                    placeholder="Other name"
                                  />
                                  <Input
                                    value={currentData.lastname}
                                    onChange={(e) => setEditData({...currentData, lastname: e.target.value})}
                                    className="h-8"
                                    placeholder="Last name"
                                  />
                                </div>
                              ) : (
                                <div className="font-medium">{reg.firstname} {reg.othername} {reg.lastname}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Select
                                  value={currentData.gender}
                                  onValueChange={(value) => setEditData({...currentData, gender: value})}
                                >
                                  <SelectTrigger className="h-8 w-[100px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="capitalize">{reg.gender}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Select
                                  value={currentData.schoolType}
                                  onValueChange={(value) => setEditData({...currentData, schoolType: value})}
                                >
                                  <SelectTrigger className="h-8 w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="capitalize">{reg.schoolType}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    value={currentData.english.term1}
                                    onChange={(e) => setEditData({...currentData, english: {...currentData.english, term1: e.target.value}})}
                                    onInput={handleScoreInput}
                                    className="h-8 w-16"
                                    min="0"
                                    max="99"
                                  />
                                  <Input
                                    type="number"
                                    value={currentData.english.term2}
                                    onChange={(e) => setEditData({...currentData, english: {...currentData.english, term2: e.target.value}})}
                                    onInput={handleScoreInput}
                                    className="h-8 w-16"
                                    min="0"
                                    max="99"
                                  />
                                  <Input
                                    type="number"
                                    value={currentData.english.term3}
                                    onChange={(e) => setEditData({...currentData, english: {...currentData.english, term3: e.target.value}})}
                                    onInput={handleScoreInput}
                                    className="h-8 w-16"
                                    min="0"
                                    max="99"
                                  />
                                </div>
                              ) : (
                                <span>{reg.english.term1}/{reg.english.term2}/{reg.english.term3}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    value={currentData.arithmetic.term1}
                                    onChange={(e) => setEditData({...currentData, arithmetic: {...currentData.arithmetic, term1: e.target.value}})}
                                    onInput={handleScoreInput}
                                    className="h-8 w-16"
                                    min="0"
                                    max="99"
                                  />
                                  <Input
                                    type="number"
                                    value={currentData.arithmetic.term2}
                                    onChange={(e) => setEditData({...currentData, arithmetic: {...currentData.arithmetic, term2: e.target.value}})}
                                    onInput={handleScoreInput}
                                    className="h-8 w-16"
                                    min="0"
                                    max="99"
                                  />
                                  <Input
                                    type="number"
                                    value={currentData.arithmetic.term3}
                                    onChange={(e) => setEditData({...currentData, arithmetic: {...currentData.arithmetic, term3: e.target.value}})}
                                    onInput={handleScoreInput}
                                    className="h-8 w-16"
                                    min="0"
                                    max="99"
                                  />
                                </div>
                              ) : (
                                <span>{reg.arithmetic.term1}/{reg.arithmetic.term2}/{reg.arithmetic.term3}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    value={currentData.general.term1}
                                    onChange={(e) => setEditData({...currentData, general: {...currentData.general, term1: e.target.value}})}
                                    onInput={handleScoreInput}
                                    className="h-8 w-16"
                                    min="0"
                                    max="99"
                                  />
                                  <Input
                                    type="number"
                                    value={currentData.general.term2}
                                    onChange={(e) => setEditData({...currentData, general: {...currentData.general, term2: e.target.value}})}
                                    onInput={handleScoreInput}
                                    className="h-8 w-16"
                                    min="0"
                                    max="99"
                                  />
                                  <Input
                                    type="number"
                                    value={currentData.general.term3}
                                    onChange={(e) => setEditData({...currentData, general: {...currentData.general, term3: e.target.value}})}
                                    onInput={handleScoreInput}
                                    className="h-8 w-16"
                                    min="0"
                                    max="99"
                                  />
                                </div>
                              ) : (
                                <span>{reg.general.term1}/{reg.general.term2}/{reg.general.term3}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Select
                                    value={currentData.religious.type}
                                    onValueChange={(value) => setEditData({...currentData, religious: {...currentData.religious, type: value}})}
                                  >
                                    <SelectTrigger className="h-8 w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="islam">Islamic</SelectItem>
                                      <SelectItem value="christian">Christian</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex gap-1">
                                    <Input
                                      type="number"
                                      value={currentData.religious.term1}
                                      onChange={(e) => setEditData({...currentData, religious: {...currentData.religious, term1: e.target.value}})}
                                      onInput={handleScoreInput}
                                      className="h-8 w-16"
                                      min="0"
                                      max="99"
                                    />
                                    <Input
                                      type="number"
                                      value={currentData.religious.term2}
                                      onChange={(e) => setEditData({...currentData, religious: {...currentData.religious, term2: e.target.value}})}
                                      onInput={handleScoreInput}
                                      className="h-8 w-16"
                                      min="0"
                                      max="99"
                                    />
                                    <Input
                                      type="number"
                                      value={currentData.religious.term3}
                                      onChange={(e) => setEditData({...currentData, religious: {...currentData.religious, term3: e.target.value}})}
                                      onInput={handleScoreInput}
                                      className="h-8 w-16"
                                      min="0"
                                      max="99"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {reg.religious.type === 'islam' ? 'Islamic' : 'Christian'}
                                  </div>
                                  <div>{reg.religious.term1}/{reg.religious.term2}/{reg.religious.term3}</div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                      setRegistrations(registrations.map(r => 
                                        r.id === reg.id ? editData! : r
                                      ));
                                      setEditingId(null);
                                      setEditData(null);
                                    }}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditData(null);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingId(reg.id);
                                      setEditData(reg);
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this student registration?')) {
                                        setRegistrations(registrations.filter(r => r.id !== reg.id));
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default SchoolRegistration;
