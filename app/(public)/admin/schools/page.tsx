"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

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

import { Badge } from "@/components/ui/badge";

interface School {
  id: string;
  name: string;
  code: string;
  lga: string;
  studentCount: number;
  status: string;
  createdAt: string;
}

export default function Schools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: "", code: "", lga: "" });

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    try {
      const response = await fetch("/api/admin/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
      toast.error("Failed to load schools");
    } finally {
      setLoading(false);
    }
  }

  const handleAddSchool = async () => {
    if (!newSchool.name || !newSchool.code || !newSchool.lga) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const response = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSchool),
      });

      if (response.ok) {
        const createdSchool = await response.json();
        setSchools([createdSchool, ...schools]);
        setNewSchool({ name: "", code: "", lga: "" });
        setIsAddDialogOpen(false);
        toast.success("School added successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add school");
      }
    } catch (error) {
      console.error("Failed to add school:", error);
      toast.error("Failed to add school");
    }
  };

  const handleDeleteSchool = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/schools?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSchools(schools.filter((school) => school.id !== id));
        toast.success("School deleted successfully");
      } else {
        toast.error("Failed to delete school");
      }
    } catch (error) {
      console.error("Failed to delete school:", error);
      toast.error("Failed to delete school");
    }
  };

  const handleToggleRegistration = (id: string) => {
    setSchools(
      schools.map((school) =>
        school.id === id
          ? { ...school, status: school.status === "Open" ? "Closed" : "Open" }
          : school
      )
    );

    toast.success("Registration status updated");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Schools Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Add, edit, and manage schools in the system
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New School
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New School</DialogTitle>
              <DialogDescription>
                Enter the details of the new school
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">School Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Government Secondary School"
                  value={newSchool.name}
                  onChange={(e) =>
                    setNewSchool({ ...newSchool, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">School Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., AN001"
                  value={newSchool.code}
                  onChange={(e) =>
                    setNewSchool({ ...newSchool, code: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lga">Local Government</Label>
                <Select
                  value={newSchool.lga}
                  onValueChange={(value) =>
                    setNewSchool({ ...newSchool, lga: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aba North">Aba North</SelectItem>
                    <SelectItem value="Aba South">Aba South</SelectItem>
                    <SelectItem value="Umuahia North">Umuahia North</SelectItem>
                    <SelectItem value="Bende">Bende</SelectItem>
                    <SelectItem value="Isiala Ngwa North">
                      Isiala Ngwa North
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddSchool}>Add School</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLE SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>All Schools ({schools.length})</CardTitle>
        </CardHeader>

        <CardContent>
          {/* FIXED TABLE OVERFLOW */}
          <div className="w-full overflow-x-auto rounded-md border">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>School Code</TableHead>
                  <TableHead>LGA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {school.name}
                    </TableCell>
                    <TableCell>{school.code}</TableCell>
                    <TableCell>{school.lga}</TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          school.status === "Open" ? "default" : "secondary"
                        }
                      >
                        {school.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Toggle Registration */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant={
                                school.status === "Open"
                                  ? "destructive"
                                  : "default"
                              }
                              size="sm"
                            >
                              <LockKeyhole className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {school.status === "Open"
                                  ? "Close"
                                  : "Open"}{" "}
                                Registration
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to{" "}
                                {school.status === "Open"
                                  ? "close"
                                  : "open"}{" "}
                                registration for {school.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleToggleRegistration(school.id)
                                }
                              >
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete School</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {school.name}?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteSchool(school.id)
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
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
