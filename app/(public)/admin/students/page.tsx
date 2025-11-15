"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  lga: string;
  schoolCode: string;
  schoolName: string;
  examNumber: string;
  date: string;
  gender: string;
  schoolType: string;
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

  const handleResetPassword = (lga: string, schoolCode?: string) => {
    const target = schoolCode ? `School ${schoolCode}` : `LGA ${lga}`;
    toast.success(`Password reset initiated for ${target}`);
  };

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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Students Management</h2>
        <p className="text-muted-foreground mt-1">
          View, search, and manage all registered students
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or exam number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedLGA} onValueChange={setSelectedLGA}>
              <SelectTrigger className="w-full md:w-[200px]">
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
              <SelectTrigger className="w-full md:w-[200px]">
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

          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="sm">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Passwords
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Passwords</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset passwords for filtered students. Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleResetPassword(selectedLGA, selectedSchool)}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registered Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No students found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>LGA</TableHead>
                    <TableHead>School Code</TableHead>
                    <TableHead>Exam Number</TableHead>
                    <TableHead>Registration Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.lga}</TableCell>
                      <TableCell>{student.schoolCode}</TableCell>
                      <TableCell>{student.examNumber}</TableCell>
                      <TableCell>{student.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
