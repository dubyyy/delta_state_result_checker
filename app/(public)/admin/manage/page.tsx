"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { 
  Trash2, 
  Ban, 
  CheckCircle2, 
  Hash, 
  School,
  MapPin,
  User,
  Church,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CountData {
  type: string;
  count: number;
  details?: any;
}

interface Result {
  id: number;
  sessionYr: string;
  fName: string;
  mName?: string;
  lName: string;
  sexCd: string;
  institutionCd: string;
  schoolName: string;
  lgaCd: string;
  examinationNo: string;
  eng?: number;
  engGrd?: string;
  arit?: number;
  aritGrd?: string;
  gp?: number;
  gpGrd?: string;
  rgs?: number;
  rgsGrd?: string;
  rgstype?: string;
  remark?: string;
  accessPin: string;
  blocked: boolean;
}

export default function ManagePage() {
  const [lgaCount, setLgaCount] = useState<number>(0);
  const [schoolsByLga, setSchoolsByLga] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Delete states
  const [deleteSchoolId, setDeleteSchoolId] = useState("");
  const [deleteStudentExam, setDeleteStudentExam] = useState("");
  const [deleteLgaCode, setDeleteLgaCode] = useState("");
  
  // Block states
  const [blockSchoolId, setBlockSchoolId] = useState("");
  const [blockStudentExam, setBlockStudentExam] = useState("");
  const [blockLgaCode, setBlockLgaCode] = useState("");
  
  // School classification states
  const [classificationSchoolId, setClassificationSchoolId] = useState("");
  const [classification, setClassification] = useState<string>("Christian");
  
  // Results states
  const [results, setResults] = useState<Result[]>([]);
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsLimit] = useState(50);
  const [resultsTotalPages, setResultsTotalPages] = useState(1);
  const [resultsTotalCount, setResultsTotalCount] = useState(0);
  const [resultsSearch, setResultsSearch] = useState("");
  const [resultsSessionFilter, setResultsSessionFilter] = useState("");
  const [resultsLgaFilter, setResultsLgaFilter] = useState("");
  const [resultsBlockedFilter, setResultsBlockedFilter] = useState("");
  const [availableSessionYears, setAvailableSessionYears] = useState<string[]>([]);
  const [availableLgaCodes, setAvailableLgaCodes] = useState<string[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [resultsPage, resultsSearch, resultsSessionFilter, resultsLgaFilter, resultsBlockedFilter]);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      // Fetch LGA count
      const lgaRes = await fetch("/api/admin/count?type=lga");
      if (lgaRes.ok) {
        const data = await lgaRes.json();
        setLgaCount(data.count);
      }

      // Fetch schools by LGA
      const schoolsRes = await fetch("/api/admin/count?type=all-schools-by-lga");
      if (schoolsRes.ok) {
        const data = await schoolsRes.json();
        setSchoolsByLga(data);
      }
    } catch (error) {
      console.error("Error fetching counts:", error);
      toast.error("Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    setResultsLoading(true);
    try {
      const params = new URLSearchParams({
        page: resultsPage.toString(),
        limit: resultsLimit.toString(),
      });

      if (resultsSearch) params.append('search', resultsSearch);
      if (resultsSessionFilter) params.append('sessionYr', resultsSessionFilter);
      if (resultsLgaFilter) params.append('lgaCode', resultsLgaFilter);
      if (resultsBlockedFilter) params.append('blocked', resultsBlockedFilter);

      const res = await fetch(`/api/admin/results?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setResultsTotalPages(data.pagination.totalPages);
        setResultsTotalCount(data.pagination.totalCount);
        setAvailableSessionYears(data.filters.sessionYears);
        setAvailableLgaCodes(data.filters.lgaCodes);
      } else {
        toast.error("Failed to fetch results");
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Failed to fetch results");
    } finally {
      setResultsLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteSchool = async () => {
    if (!deleteSchoolId) {
      toast.error("Please enter a school ID");
      return;
    }

    try {
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "school", id: deleteSchoolId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setDeleteSchoolId("");
        fetchCounts();
      } else {
        toast.error(data.error || "Failed to delete school");
      }
    } catch (error) {
      toast.error("An error occurred while deleting school");
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentExam) {
      toast.error("Please enter an examination number");
      return;
    }

    try {
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "student", examNumber: deleteStudentExam }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setDeleteStudentExam("");
      } else {
        toast.error(data.error || "Failed to delete student");
      }
    } catch (error) {
      toast.error("An error occurred while deleting student");
    }
  };

  const handleDeleteLga = async () => {
    if (!deleteLgaCode) {
      toast.error("Please enter an LGA code");
      return;
    }

    try {
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lga", lgaCode: deleteLgaCode }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setDeleteLgaCode("");
        fetchCounts();
      } else {
        toast.error(data.error || "Failed to delete LGA");
      }
    } catch (error) {
      toast.error("An error occurred while deleting LGA");
    }
  };

  // Block handlers
  const handleBlockSchool = async (blocked: boolean) => {
    if (!blockSchoolId) {
      toast.error("Please enter a school ID");
      return;
    }

    try {
      const res = await fetch("/api/admin/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "school", id: blockSchoolId, blocked }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setBlockSchoolId("");
      } else {
        toast.error(data.error || "Failed to update school block status");
      }
    } catch (error) {
      toast.error("An error occurred while updating school block status");
    }
  };

  const handleBlockStudent = async (blocked: boolean) => {
    if (!blockStudentExam) {
      toast.error("Please enter an examination number");
      return;
    }

    try {
      const res = await fetch("/api/admin/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "student", examNumber: blockStudentExam, blocked }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setBlockStudentExam("");
      } else {
        toast.error(data.error || "Failed to update student block status");
      }
    } catch (error) {
      toast.error("An error occurred while updating student block status");
    }
  };

  const handleBlockLga = async (blocked: boolean) => {
    if (!blockLgaCode) {
      toast.error("Please enter an LGA code");
      return;
    }

    try {
      const res = await fetch("/api/admin/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lga", lgaCode: blockLgaCode, blocked }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setBlockLgaCode("");
      } else {
        toast.error(data.error || "Failed to update LGA block status");
      }
    } catch (error) {
      toast.error("An error occurred while updating LGA block status");
    }
  };

  // Classification handler
  const handleUpdateClassification = async () => {
    if (!classificationSchoolId) {
      toast.error("Please enter a school ID");
      return;
    }

    try {
      const res = await fetch("/api/admin/school-classification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          schoolId: classificationSchoolId, 
          classification: classification === "None" ? null : classification 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setClassificationSchoolId("");
      } else {
        toast.error(data.error || "Failed to update school classification");
      }
    } catch (error) {
      toast.error("An error occurred while updating school classification");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Management Console</h2>
        <p className="text-muted-foreground mt-1">
          Manage schools, students, and LGAs with counting, blocking, and deletion capabilities
        </p>
      </div>

      {/* Statistics Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total LGAs</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lgaCount}</div>
            <p className="text-xs text-muted-foreground">
              Distinct Local Government Areas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schools by LGA</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schoolsByLga.length}</div>
            <p className="text-xs text-muted-foreground">
              LGAs with registered schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Available</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9</div>
            <p className="text-xs text-muted-foreground">
              Management operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="count" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="count">Count</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="delete">Delete</TabsTrigger>
          <TabsTrigger value="block">Block</TabsTrigger>
          <TabsTrigger value="classify">Classify</TabsTrigger>
        </TabsList>

        {/* COUNT TAB */}
        <TabsContent value="count" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Count Statistics</CardTitle>
              <CardDescription>View counts of LGAs and schools within each LGA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  LGAs
                </h3>
                <p className="text-2xl font-bold">{lgaCount} Total LGAs</p>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <School className="h-4 w-4" />
                  Schools by LGA
                </h3>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {schoolsByLga.map((lga) => (
                    <div key={lga.lgaCode} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">{lga.lgaCode}</span>
                      <span className="text-sm text-muted-foreground">{lga.count} schools</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={fetchCounts} variant="outline" className="w-full">
                Refresh Counts
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESULTS TAB */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Results Management
              </CardTitle>
              <CardDescription>View, search, and manage student results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="results-search" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </Label>
                  <Input
                    id="results-search"
                    placeholder="Name or Exam No..."
                    value={resultsSearch}
                    onChange={(e) => {
                      setResultsSearch(e.target.value);
                      setResultsPage(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Session Year
                  </Label>
                  <Select value={resultsSessionFilter} onValueChange={(value) => {
                    setResultsSessionFilter(value);
                    setResultsPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sessions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sessions</SelectItem>
                      {availableSessionYears.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    LGA
                  </Label>
                  <Select value={resultsLgaFilter} onValueChange={(value) => {
                    setResultsLgaFilter(value);
                    setResultsPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All LGAs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All LGAs</SelectItem>
                      {availableLgaCodes.map((lga) => (
                        <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Ban className="h-4 w-4" />
                    Status
                  </Label>
                  <Select value={resultsBlockedFilter} onValueChange={(value) => {
                    setResultsBlockedFilter(value);
                    setResultsPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="false">Active</SelectItem>
                      <SelectItem value="true">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex justify-between items-center px-2">
                <p className="text-sm text-muted-foreground">
                  Showing {results.length} of {resultsTotalCount} results
                </p>
                <Button onClick={fetchResults} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {/* Results Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Exam No</th>
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">School</th>
                        <th className="px-4 py-3 text-left font-medium">LGA</th>
                        <th className="px-4 py-3 text-left font-medium">Session</th>
                        <th className="px-4 py-3 text-left font-medium">Eng</th>
                        <th className="px-4 py-3 text-left font-medium">Arit</th>
                        <th className="px-4 py-3 text-left font-medium">GP</th>
                        <th className="px-4 py-3 text-left font-medium">RGS</th>
                        <th className="px-4 py-3 text-left font-medium">Remark</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultsLoading ? (
                        <tr>
                          <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                            Loading results...
                          </td>
                        </tr>
                      ) : results.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                            No results found
                          </td>
                        </tr>
                      ) : (
                        results.map((result) => (
                          <tr key={result.id} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-3 font-mono text-xs">{result.examinationNo}</td>
                            <td className="px-4 py-3">
                              {result.fName} {result.mName} {result.lName}
                            </td>
                            <td className="px-4 py-3 text-xs">{result.schoolName}</td>
                            <td className="px-4 py-3">{result.lgaCd}</td>
                            <td className="px-4 py-3">{result.sessionYr}</td>
                            <td className="px-4 py-3">
                              {result.eng ? `${result.eng} (${result.engGrd})` : '-'}
                            </td>
                            <td className="px-4 py-3">
                              {result.arit ? `${result.arit} (${result.aritGrd})` : '-'}
                            </td>
                            <td className="px-4 py-3">
                              {result.gp ? `${result.gp} (${result.gpGrd})` : '-'}
                            </td>
                            <td className="px-4 py-3">
                              {result.rgs ? `${result.rgs} (${result.rgsGrd})` : '-'}
                            </td>
                            <td className="px-4 py-3">{result.remark || '-'}</td>
                            <td className="px-4 py-3">
                              {result.blocked ? (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  Blocked
                                </span>
                              ) : (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Active
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResultsPage(p => Math.max(1, p - 1))}
                  disabled={resultsPage === 1 || resultsLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {resultsPage} of {resultsTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResultsPage(p => Math.min(resultsTotalPages, p + 1))}
                  disabled={resultsPage === resultsTotalPages || resultsLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DELETE TAB */}
        <TabsContent value="delete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delete Operations</CardTitle>
              <CardDescription>Permanently delete schools, students, or entire LGAs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delete School */}
              <div className="space-y-3">
                <Label htmlFor="delete-school" className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  Delete School
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="delete-school"
                    placeholder="Enter School ID"
                    value={deleteSchoolId}
                    onChange={(e) => setDeleteSchoolId(e.target.value)}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={!deleteSchoolId}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete School</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the school and all associated student records.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSchool} className="bg-destructive text-destructive-foreground">
                          Delete School
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Delete Student */}
              <div className="space-y-3">
                <Label htmlFor="delete-student" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Delete Student
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="delete-student"
                    placeholder="Enter Examination Number"
                    value={deleteStudentExam}
                    onChange={(e) => setDeleteStudentExam(e.target.value)}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={!deleteStudentExam}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the student record.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive text-destructive-foreground">
                          Delete Student
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Delete LGA */}
              <div className="space-y-3">
                <Label htmlFor="delete-lga" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delete LGA
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="delete-lga"
                    placeholder="Enter LGA Code"
                    value={deleteLgaCode}
                    onChange={(e) => setDeleteLgaCode(e.target.value)}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={!deleteLgaCode}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Entire LGA</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete ALL schools, students, and data for this LGA.
                          This is a CRITICAL action that cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLga} className="bg-destructive text-destructive-foreground">
                          Delete LGA
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BLOCK TAB */}
        <TabsContent value="block" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Block/Unblock Operations</CardTitle>
              <CardDescription>Block or unblock schools, students, or entire LGAs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Block School */}
              <div className="space-y-3">
                <Label htmlFor="block-school" className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  Block/Unblock School
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="block-school"
                    placeholder="Enter School ID"
                    value={blockSchoolId}
                    onChange={(e) => setBlockSchoolId(e.target.value)}
                  />
                  <Button 
                    variant="destructive" 
                    disabled={!blockSchoolId}
                    onClick={() => handleBlockSchool(true)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Block
                  </Button>
                  <Button 
                    variant="default" 
                    disabled={!blockSchoolId}
                    onClick={() => handleBlockSchool(false)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Unblock
                  </Button>
                </div>
              </div>

              {/* Block Student */}
              <div className="space-y-3">
                <Label htmlFor="block-student" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Block/Unblock Student
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="block-student"
                    placeholder="Enter Examination Number"
                    value={blockStudentExam}
                    onChange={(e) => setBlockStudentExam(e.target.value)}
                  />
                  <Button 
                    variant="destructive" 
                    disabled={!blockStudentExam}
                    onClick={() => handleBlockStudent(true)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Block
                  </Button>
                  <Button 
                    variant="default" 
                    disabled={!blockStudentExam}
                    onClick={() => handleBlockStudent(false)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Unblock
                  </Button>
                </div>
              </div>

              {/* Block LGA */}
              <div className="space-y-3">
                <Label htmlFor="block-lga" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Block/Unblock LGA
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="block-lga"
                    placeholder="Enter LGA Code"
                    value={blockLgaCode}
                    onChange={(e) => setBlockLgaCode(e.target.value)}
                  />
                  <Button 
                    variant="destructive" 
                    disabled={!blockLgaCode}
                    onClick={() => handleBlockLga(true)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Block
                  </Button>
                  <Button 
                    variant="default" 
                    disabled={!blockLgaCode}
                    onClick={() => handleBlockLga(false)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Unblock
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLASSIFY TAB */}
        <TabsContent value="classify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School Religious Classification</CardTitle>
              <CardDescription>Set or change a school's religious classification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="classification-school" className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  School ID
                </Label>
                <Input
                  id="classification-school"
                  placeholder="Enter School ID"
                  value={classificationSchoolId}
                  onChange={(e) => setClassificationSchoolId(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Church className="h-4 w-4" />
                  Religious Classification
                </Label>
                <Select value={classification} onValueChange={setClassification}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Christian">Christian</SelectItem>
                    <SelectItem value="Muslim">Muslim</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleUpdateClassification}
                disabled={!classificationSchoolId}
                className="w-full"
              >
                Update Classification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
