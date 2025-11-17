"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Student {
  id: string;
  studentNumber: string;
  firstname: string;
  othername: string | null;
  lastname: string;
  gender: string;
  schoolType: string;
  passport: string | null;
  
  // English scores
  englishTerm1: string | null;
  englishTerm2: string | null;
  englishTerm3: string | null;
  
  // Arithmetic scores
  arithmeticTerm1: string | null;
  arithmeticTerm2: string | null;
  arithmeticTerm3: string | null;
  
  // General Paper scores
  generalTerm1: string | null;
  generalTerm2: string | null;
  generalTerm3: string | null;
  
  // Religious Studies
  religiousType: string | null;
  religiousTerm1: string | null;
  religiousTerm2: string | null;
  religiousTerm3: string | null;
  
  // Additional info
  lga: string;
  schoolCode: string;
  schoolName: string;
  date: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLGA, setSelectedLGA] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [uniqueLGAs, setUniqueLGAs] = useState<string[]>([]);
  const [uniqueSchools, setUniqueSchools] = useState<string[]>([]);

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, selectedLGA, selectedSchool]);

  async function fetchStudents() {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedLGA && selectedLGA !== "all") params.append("lga", selectedLGA);
      if (selectedSchool && selectedSchool !== "all") params.append("schoolCode", selectedSchool);

      const response = await fetch(`/api/admin/students?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);

        // Extract unique LGAs and schools for filters
        const lgas = Array.from(new Set(data.map((s: Student) => s.lga)));
        const schools = Array.from(new Set(data.map((s: Student) => s.schoolCode)));
        setUniqueLGAs(lgas as string[]);
        setUniqueSchools(schools as string[]);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Students Management</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          View, search, and manage all registered students
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or exam number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 text-sm sm:text-base"
              />
            </div>
            
            <Select value={selectedLGA} onValueChange={setSelectedLGA}>
              <SelectTrigger className="w-full sm:w-[200px] text-sm sm:text-base">
                <SelectValue placeholder="Select LGA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LGAs</SelectItem>
                {uniqueLGAs.map(lga => (
                  <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger className="w-full sm:w-[200px] text-sm sm:text-base">
                <SelectValue placeholder="Select School" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {uniqueSchools.map(code => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden w-full">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Registered Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No students found</p>
          ) : (
            <div className="overflow-x-auto w-full" style={{ maxWidth: '100%' }}>
              <div className="inline-block min-w-full align-middle">
                <Table className="w-full table-fixed text-xs sm:text-sm" style={{ minWidth: '1800px' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Photo</TableHead>
                      <TableHead className="w-[150px] sticky left-[80px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Student Number</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Other Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>School Type</TableHead>
                      <TableHead colSpan={3} className="text-center border-l-2">English</TableHead>
                      <TableHead colSpan={3} className="text-center border-l-2">Arithmetic</TableHead>
                      <TableHead colSpan={3} className="text-center border-l-2">General Paper</TableHead>
                      <TableHead colSpan={4} className="text-center border-l-2">Religious Studies</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></TableHead>
                      <TableHead className="sticky left-[80px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead className="text-center text-xs border-l-2">Term 1</TableHead>
                      <TableHead className="text-center text-xs">Term 2</TableHead>
                      <TableHead className="text-center text-xs">Term 3</TableHead>
                      <TableHead className="text-center text-xs border-l-2">Term 1</TableHead>
                      <TableHead className="text-center text-xs">Term 2</TableHead>
                      <TableHead className="text-center text-xs">Term 3</TableHead>
                      <TableHead className="text-center text-xs border-l-2">Term 1</TableHead>
                      <TableHead className="text-center text-xs">Term 2</TableHead>
                      <TableHead className="text-center text-xs">Term 3</TableHead>
                      <TableHead className="text-center text-xs border-l-2">Type</TableHead>
                      <TableHead className="text-center text-xs">Term 1</TableHead>
                      <TableHead className="text-center text-xs">Term 2</TableHead>
                      <TableHead className="text-center text-xs">Term 3</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const initials = `${student.firstname[0]}${student.lastname[0]}`
                        .toUpperCase();
                      
                      return (
                        <TableRow key={student.id} className="group hover:bg-muted/50">
                          <TableCell className="sticky left-0 bg-background group-hover:bg-muted/50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={student.passport || ""} 
                                alt={`${student.firstname} ${student.lastname}`}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {initials || <User className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium sticky left-[80px] bg-background group-hover:bg-muted/50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{student.studentNumber}</TableCell>
                          <TableCell>{student.firstname}</TableCell>
                          <TableCell>{student.othername || "-"}</TableCell>
                          <TableCell>{student.lastname}</TableCell>
                          <TableCell>{student.gender}</TableCell>
                          <TableCell>{student.schoolType}</TableCell>
                          
                          {/* English scores */}
                          <TableCell className="text-center border-l-2">{student.englishTerm1 || "-"}</TableCell>
                          <TableCell className="text-center">{student.englishTerm2 || "-"}</TableCell>
                          <TableCell className="text-center">{student.englishTerm3 || "-"}</TableCell>
                          
                          {/* Arithmetic scores */}
                          <TableCell className="text-center border-l-2">{student.arithmeticTerm1 || "-"}</TableCell>
                          <TableCell className="text-center">{student.arithmeticTerm2 || "-"}</TableCell>
                          <TableCell className="text-center">{student.arithmeticTerm3 || "-"}</TableCell>
                          
                          {/* General Paper scores */}
                          <TableCell className="text-center border-l-2">{student.generalTerm1 || "-"}</TableCell>
                          <TableCell className="text-center">{student.generalTerm2 || "-"}</TableCell>
                          <TableCell className="text-center">{student.generalTerm3 || "-"}</TableCell>
                          
                          {/* Religious Studies */}
                          <TableCell className="text-center border-l-2 text-xs">{student.religiousType || "-"}</TableCell>
                          <TableCell className="text-center">{student.religiousTerm1 || "-"}</TableCell>
                          <TableCell className="text-center">{student.religiousTerm2 || "-"}</TableCell>
                          <TableCell className="text-center">{student.religiousTerm3 || "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
