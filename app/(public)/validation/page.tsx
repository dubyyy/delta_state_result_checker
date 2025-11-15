"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from 'next/link';

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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((student) => (
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Validation;
