"use client";

import { useState } from "react";
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

const mockStudents = [
  { id: 1, name: "Chidinma Okafor", lga: "Aba North", schoolCode: "AN001", examNumber: "2024001", date: "2024-01-15" },
  { id: 2, name: "Emeka Nwosu", lga: "Aba South", schoolCode: "AS002", examNumber: "2024002", date: "2024-01-16" },
  { id: 3, name: "Ngozi Eze", lga: "Umuahia North", schoolCode: "UN003", examNumber: "2024003", date: "2024-01-17" },
  { id: 4, name: "Chukwuma Obi", lga: "Aba North", schoolCode: "AN001", examNumber: "2024004", date: "2024-01-18" },
  { id: 5, name: "Adaeze Okoro", lga: "Isiala Ngwa North", schoolCode: "IN004", examNumber: "2024005", date: "2024-01-19" },
  { id: 6, name: "Oluchi Nnamdi", lga: "Bende", schoolCode: "BE005", examNumber: "2024006", date: "2024-01-20" },
];

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLGA, setSelectedLGA] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");

  const handleResetPassword = (lga: string, schoolCode?: string) => {
    const target = schoolCode ? `School ${schoolCode}` : `LGA ${lga}`;
    toast.success(`Password reset initiated for ${target}`);
  };

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.examNumber.includes(searchTerm);
    const matchesLGA = selectedLGA === "all" || student.lga === selectedLGA;
    const matchesSchool = selectedSchool === "all" || student.schoolCode === selectedSchool;
    return matchesSearch && matchesLGA && matchesSchool;
  });

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
                <SelectItem value="Aba North">Aba North</SelectItem>
                <SelectItem value="Aba South">Aba South</SelectItem>
                <SelectItem value="Umuahia North">Umuahia North</SelectItem>
                <SelectItem value="Bende">Bende</SelectItem>
                <SelectItem value="Isiala Ngwa North">Isiala Ngwa North</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select School" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                <SelectItem value="AN001">AN001</SelectItem>
                <SelectItem value="AS002">AS002</SelectItem>
                <SelectItem value="UN003">UN003</SelectItem>
                <SelectItem value="IN004">IN004</SelectItem>
                <SelectItem value="BE005">BE005</SelectItem>
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
          <CardTitle>Registered Students ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
                {filteredStudents.map((student) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
