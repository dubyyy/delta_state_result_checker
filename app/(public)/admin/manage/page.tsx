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
  Church
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CountData {
  type: string;
  count: number;
  details?: any;
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

  useEffect(() => {
    fetchCounts();
  }, []);

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="count">Count</TabsTrigger>
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
