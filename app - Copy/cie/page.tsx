"use client";

import { useState, useEffect } from "react";
import { LGA_MAPPING } from "@/lib/lga-mapping";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Edit,
  Search,
  RefreshCw,
  LogOut,
  Users,
  School,
  Calendar,
  ShieldCheck,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";


interface StudentSchool {
  schoolName: string;
  lgaCode?: string;
}

interface Student {
  id: string;
  studentNumber: string;
  firstname: string;
  othername?: string | null;
  lastname: string;
  gender?: string;
  schoolType?: string;
  year?: string;
  status?: string;
  passport?: string | null;
  lateRegistration?: boolean;
  school: StudentSchool;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CIEStudentsPage() {
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem("cieAuthToken");
    router.push("/");
  };

  const [authData, setAuthData] = useState<{ lgaCode: string; lCode: string } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Student | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Enhanced filters
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"number" | "name" | "school">("number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    try {
      const token = localStorage.getItem("cieAuthToken");
      if (!token) return;

      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.lgaCode) {
        setAuthData({ lgaCode: payload.lgaCode, lCode: "" });
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [authData]);

  useEffect(() => {
    if (authData) loadStudents();
  }, [authData, page]);

  const loadStudents = async () => {
    if (!authData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("cieAuthToken");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const params = new URLSearchParams({
        lgaCode: authData.lgaCode,
        page: page.toString(),
        limit: "50",
      });
      const res = await fetch(`/api/cie/students?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("cieAuthToken");
          router.push("/");
          toast.error("Session expired. Please login again.");
          return;
        }
        throw new Error(await res.text());
      }
      const data = await res.json();
      setStudents(data.data ?? []);
      setMeta(data.meta ?? null);
    } catch (err) {
      console.error(err);
      toast.error("Could not load students");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!searchQuery && yearFilter === "all" && schoolFilter === "all") return true;

    const q = searchQuery.toLowerCase();
    const name = `${s.lastname} ${s.othername || ""} ${s.firstname}`.toLowerCase();
    const matchesSearch = !searchQuery || (
      s.studentNumber.toLowerCase().includes(q) ||
      name.includes(q) ||
      s.gender?.toLowerCase().includes(q) ||
      s.schoolType?.toLowerCase().includes(q) ||
      s.school.schoolName.toLowerCase().includes(q)
    );

    const matchesYear = yearFilter === "all" || s.year === yearFilter;
    const matchesSchool = schoolFilter === "all" || s.school.schoolName === schoolFilter;

    return matchesSearch && matchesYear && matchesSchool;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let comparison = 0;

    if (sortBy === "number") {
      comparison = a.studentNumber.localeCompare(b.studentNumber, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    } else if (sortBy === "name") {
      const nameA = `${a.lastname} ${a.firstname}`.toLowerCase();
      const nameB = `${b.lastname} ${b.firstname}`.toLowerCase();
      comparison = nameA.localeCompare(nameB);
    } else if (sortBy === "school") {
      comparison = a.school.schoolName.localeCompare(b.school.schoolName);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Get unique years and schools for filters
  const uniqueYears = Array.from(new Set(students.map(s => s.year).filter(Boolean))).sort();
  const uniqueSchools = Array.from(new Set(students.map(s => s.school.schoolName))).sort();

  // Calculate statistics
  const maleCount = students.filter(s => s.gender?.toLowerCase() === "male").length;
  const femaleCount = students.filter(s => s.gender?.toLowerCase() === "female").length;
  const lateRegCount = students.filter(s => s.lateRegistration).length;

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({ ...student });
    setEditError("");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData) return;
    setIsSavingEdit(true);
    setEditError("");

    try {
      // TODO: real PATCH / PUT request here
      console.log("Would save:", editFormData);

      // Simulate API delay
      await new Promise(r => setTimeout(r, 800));

      setStudents((prev) =>
        prev.map((s) => (s.id === editFormData.id ? editFormData : s))
      );
      toast.success("Student updated successfully");
      setIsEditModalOpen(false);
    } catch (err) {
      setEditError("Failed to save changes");
      toast.error("Failed to save changes");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Student Number", "Surname", "First Name", "Middle Name", "Gender", "School", "Type", "Year", "Registration"];
    const rows = sortedStudents.map(s => [
      s.studentNumber,
      s.lastname,
      s.firstname,
      s.othername || "",
      s.gender || "",
      s.school.schoolName,
      s.schoolType || "",
      s.year || "",
      s.lateRegistration ? "Late" : "Regular"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `cie_students_${lgaName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export successful!");
  };

  // Derived Stats
  const lgaName = authData ? (LGA_MAPPING[authData.lgaCode] || authData.lgaCode) : "...";
  const totalCount = meta?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-slate-50 to-blue-50/40 font-sans flex flex-col">
      {/* ─── Top Header ────────────────────────────────────────────── */}
      <div className="sticky top-4 z-40 px-4 mb-4">
        <header className="mx-auto max-w-7xl rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm px-4 h-16 flex items-center justify-between ring-1 ring-black/5">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-blue-700 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-sm font-bold text-slate-800 leading-tight">CIE Dashboard</h1>
              <p className="text-[11px] text-slate-500 font-medium">Ministry of Basic Education</p>
            </div>
            <span className="md:hidden font-bold text-slate-800 tracking-tight">CIE Portal</span>
          </div>

          <div className="flex items-center gap-3">
            {authData && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{lgaName}</span>
              </div>
            )}

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-medium"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
      </div>

      {/* ─── Main Content ──────────────────────────────────────────── */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 pb-12 space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard Overview</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-lg leading-relaxed">
              Monitoring student registration data and performance metrics for <span className="font-semibold text-slate-700">{lgaName}</span>.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative group overflow-hidden bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-20 h-20 text-blue-600" />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Total Enrolled</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                {loading ? <span className="animate-pulse">...</span> : totalCount.toLocaleString()}
              </h3>
              <div className="mt-3 flex items-center gap-2">
                <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-100">
                  {lgaName}
                </div>
              </div>
            </div>
          </div>

          <div className="relative group overflow-hidden bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-20 h-20 text-purple-600" />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Gender Distribution</p>
              <div className="mt-2 flex items-baseline gap-3">
                <div>
                  <h3 className="text-2xl font-extrabold text-blue-600 tracking-tight">{maleCount}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Male</p>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div>
                  <h3 className="text-2xl font-extrabold text-pink-600 tracking-tight">{femaleCount}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Female</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group overflow-hidden bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Calendar className="w-20 h-20 text-amber-600" />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Late Registrations</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                {lateRegCount}
              </h3>
              <div className="mt-3 flex items-center gap-2">
                <div className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-100">
                  2025/2026
                </div>
              </div>
            </div>
          </div>

          <div className="relative group overflow-hidden bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="w-20 h-20 text-emerald-600" />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Portal Status</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h3 className="text-xl font-bold text-slate-900">Active</h3>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                  Online
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden relative">

          {/* Toolbar */}
          <div className="p-6 border-b border-slate-100 space-y-4 bg-gradient-to-br from-slate-50/50 to-white">
            {/* Search Bar */}
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600" />
              </div>
              <Input
                placeholder="Search by name, student number, school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition-all shadow-sm text-base"
              />
            </div>

            {/* Filters and Actions Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Year Filter */}
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="h-10 w-[140px] bg-white border-slate-200 rounded-lg shadow-sm">
                  <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year || "unknown"}>{year || "Unknown"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* School Filter */}
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger className="h-10 w-[180px] bg-white border-slate-200 rounded-lg shadow-sm">
                  <School className="h-4 w-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {uniqueSchools.map(school => (
                    <SelectItem key={school} value={school}>{school}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="h-10 w-[160px] bg-white border-slate-200 rounded-lg shadow-sm">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Student Number</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="h-10 w-10 p-0 bg-white border-slate-200 rounded-lg shadow-sm"
              >
                {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>

              <div className="flex-1" />

              {/* Clear Filters */}
              {(searchQuery || yearFilter !== "all" || schoolFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setYearFilter("all");
                    setSchoolFilter("all");
                  }}
                  className="h-10 text-slate-500 hover:text-slate-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}

              {/* Export CSV */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={sortedStudents.length === 0}
                className="h-10 bg-gradient-to-r from-green-50 to-emerald-50 border-emerald-200 text-emerald-700 hover:from-emerald-100 hover:to-green-100 rounded-lg shadow-sm font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={loadStudents}
                disabled={loading}
                className="h-10 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg shadow-sm"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin", !loading && "mr-2")} />
                {!loading && "Refresh"}
              </Button>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-slate-600">
                Showing <span className="font-semibold text-slate-900">{sortedStudents.length}</span> of <span className="font-semibold text-slate-900">{students.length}</span> students
              </p>
            </div>
          </div>

          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-50/80 border-b border-slate-100">
                  <TableHead className="w-[80px] py-4 pl-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Photo</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Identifier</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Student Name</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Gender</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">School</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">Reg. Type</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 hidden lg:table-cell text-right pr-8">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6"><div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-48 bg-slate-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-slate-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-4 w-16 bg-slate-100 rounded animate-pulse" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse ml-auto" /></TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                ) : sortedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-96 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                        <div className="p-6 bg-slate-50 rounded-full shadow-inner">
                          <Search className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mt-2">No results found</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                          {searchQuery
                            ? `We couldn't find any students matching "${searchQuery}". Try a different search term.`
                            : "There are no student records available for this Local Government Area at the moment."}
                        </p>
                        {searchQuery && (
                          <Button
                            variant="secondary"
                            onClick={() => setSearchQuery("")}
                            className="mt-4 text-blue-600 bg-blue-50 hover:bg-blue-100"
                          >
                            Clear search filter
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStudents.map((student, i) => (
                    <TableRow
                      key={student.id}
                      className="group hover:bg-blue-50/40 transition-all duration-200 border-b border-slate-50"
                      style={{ transitionDelay: `${i * 20}ms` }}
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="relative h-11 w-11 rounded-full overflow-hidden bg-slate-100 ring-2 ring-white shadow-sm group-hover:ring-blue-100 transition-all">
                          {student.passport ? (
                            <img
                              src={student.passport}
                              alt="Passport"
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300 bg-slate-100">
                              <Users className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-600 tracking-tight">
                        {student.studentNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">
                            {student.lastname}, {student.firstname}
                          </span>
                          {student.othername && (
                            <span className="text-xs text-slate-400 font-medium">{student.othername}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium capitalize text-slate-600 bg-slate-100 hover:bg-slate-200 border-none shadow-none px-2.5">
                          {student.gender}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        <div className="flex items-center gap-2 max-w-[220px]">
                          <School className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium group-hover:text-blue-700 transition-colors" title={student.school.schoolName}>
                            {student.school.schoolName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-xs font-medium text-slate-500 border border-slate-100">
                          <GraduationCap className="w-3 h-3 mr-1.5" />
                          {student.schoolType || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right pr-8">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border",
                          student.lateRegistration
                            ? "bg-amber-50 text-amber-700 border-amber-200/50"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full mr-1.5",
                            student.lateRegistration ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                          {student.lateRegistration ? "Late" : "Regular"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(student)}
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-100 transition-all rounded-lg opacity-0 group-hover:opacity-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {meta && meta.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{((page - 1) * meta.limit) + 1}</span> to <span className="font-bold text-slate-900">{Math.min(page * meta.limit, meta.total)}</span> of <span className="font-bold text-slate-900">{meta.total}</span> entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                    // Logic for simplified pagination numbers
                    let pNum = i + 1;
                    if (meta.totalPages > 5 && page > 3) {
                      pNum = page - 2 + i;
                    }
                    return (
                      pNum <= meta.totalPages && (
                        <button
                          key={pNum}
                          onClick={() => setPage(pNum)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
                            page === pNum
                              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                              : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {pNum}
                        </button>
                      )
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages || loading}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-2xl border-none shadow-2xl">
          <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Edit className="h-5 w-5" />
                </div>
                Edit Student Record
              </DialogTitle>
              <DialogDescription className="ml-11">
                Updating details for <span className="font-mono text-slate-900 font-bold bg-slate-100 px-1 py-0.5 rounded text-xs ml-1">{editFormData?.studentNumber}</span>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6">
            {editError && (
              <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-red-500" />
                {editError}
              </div>
            )}

            {editFormData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-slate-500 tracking-wider font-bold">First Name</Label>
                  <Input
                    value={editFormData.firstname}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all"
                    onChange={e => setEditFormData({ ...editFormData, firstname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-slate-500 tracking-wider font-bold">Surname</Label>
                  <Input
                    value={editFormData.lastname}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all"
                    onChange={e => setEditFormData({ ...editFormData, lastname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-slate-500 tracking-wider font-bold">Middle Name</Label>
                  <Input
                    value={editFormData.othername || ""}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all"
                    onChange={e => setEditFormData({ ...editFormData, othername: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-slate-500 tracking-wider font-bold">Gender</Label>
                  <Select
                    value={editFormData.gender}
                    onValueChange={v => setEditFormData({ ...editFormData, gender: v })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="h-11 px-6 rounded-xl border-slate-200 hover:bg-white text-slate-600 font-medium">Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20">
              {isSavingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}