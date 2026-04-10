"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { LGA_MAPPING, getLGACode } from "@/lib/lga-mapping";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface Student {
  id: string;
  accCode: string;
  studentNumber: string;
  firstname: string;
  othername: string | null;
  lastname: string;
  dateOfBirth: string | null;
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
  lgaCode?: string;
  lCode?: string;
  schoolCode: string;
  schoolName: string;
  date: string;
  prcd?: number;
  year?: string;
  registrationType?: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLGA, setSelectedLGA] = useState("all");
  const [schoolCodeInput, setSchoolCodeInput] = useState("");
  const [registrationType, setRegistrationType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  // Ensure students is always an array
  const safeStudents = Array.isArray(students) ? students : [];

  // All LGAs in Delta State from the mapping
  const allLGAs = Object.values(LGA_MAPPING).sort();

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, selectedLGA, schoolCodeInput, registrationType, page, limit]);

  async function fetchStudents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedLGA && selectedLGA !== "all") params.append("lga", selectedLGA);
      if (schoolCodeInput) params.append("schoolCode", schoolCodeInput);
      if (registrationType && registrationType !== "all") params.append("registrationType", registrationType);
      params.append("page", String(page));
      params.append("limit", String(limit));

      const response = await fetch(`/api/admin/students?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        // Ensure we always set an array
        if (result && Array.isArray(result.data)) {
          // Double-check that result.data is truly an array before setting
          setStudents(Array.isArray(result.data) ? result.data : []);

          if (result.pagination) {
            setPagination({
              page: Number(result.pagination.page) || 1,
              limit: Number(result.pagination.limit) || limit,
              total: Number(result.pagination.total) || 0,
              totalPages: Number(result.pagination.totalPages) || 1,
            });
          } else {
            setPagination({
              page,
              limit,
              total: Array.isArray(result.data) ? result.data.length : 0,
              totalPages: 1,
            });
          }
        } else if (result && result.error) {
          console.error("API error:", result.error);
          setStudents([]);
          setPagination({ page: 1, limit, total: 0, totalPages: 1 });
          toast.error(result.error);
        } else {
          console.error("Invalid data structure from API:", result);
          setStudents([]);
          setPagination({ page: 1, limit, total: 0, totalPages: 1 });
          toast.error("Received invalid data from server");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Request failed:", errorData);
        setStudents([]);
        setPagination({ page: 1, limit, total: 0, totalPages: 1 });
        toast.error(errorData.error || "Failed to load students");
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setStudents([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [downloadingAllImages, setDownloadingAllImages] = useState(false);

  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number; status: string } | null>(null);

  async function downloadFixedImages() {
    try {
      setDownloadingAllImages(true);
      setDownloadProgress({ current: 0, total: 0, status: 'counting' });
      toast.info("Preparing fixed images download for 047xxxx and 058xxxx...", { duration: 5000 });

      // Step 1: Get total chunks info
      const infoRes = await fetch(`/api/admin/students/download-fixed-images?totalChunks=true`);
      if (!infoRes.ok) {
        const error = await infoRes.json();
        throw new Error(error.error || 'Failed to get download info');
      }

      const { totalImages, totalChunks, chunkSize, studentCount047, studentCount058, postCount047, postCount058 } = await infoRes.json();
      console.log(`[Fixed Download] 047: ${studentCount047}, 058: ${studentCount058}, Post047: ${postCount047}, Post058: ${postCount058}`);

      if (totalImages === 0) {
        toast.error("No images found for 047xxxx or 058xxxx exam numbers");
        return;
      }

      toast.info(`Found ${totalImages.toLocaleString()} images (047xxxx: ${studentCount047 + postCount047}, 058xxxx: ${studentCount058 + postCount058}). Downloading in ${totalChunks} parts...`, { duration: 5000 });
      setDownloadProgress({ current: 0, total: totalChunks, status: 'downloading' });

      // Step 2: Download each chunk sequentially
      for (let i = 0; i < totalChunks; i++) {
        console.log(`[Fixed Download] Processing chunk ${i + 1} of ${totalChunks}`);
        setDownloadProgress({ current: i + 1, total: totalChunks, status: 'downloading' });

        const response = await fetch(`/api/admin/students/download-fixed-images?chunk=${i}`);
        console.log(`[Fixed Download] Chunk ${i + 1} response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Fixed Download] Failed to download chunk ${i + 1}:`, errorText);
          toast.error(`Failed to download part ${i + 1} of ${totalChunks}`);
          continue;
        }

        const blob = await response.blob();
        console.log(`[Fixed Download] Chunk ${i + 1} blob size: ${blob.size} bytes`);
        const url = URL.createObjectURL(blob);

        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
        const filename = filenameMatch ? filenameMatch[1] : `fixed_images_part${i + 1}of${totalChunks}.zip`;

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (i < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log('[Fixed Download] All chunks completed!');
      setDownloadProgress({ current: totalChunks, total: totalChunks, status: 'completed' });
      toast.success(`Downloaded all fixed images successfully! Check your downloads folder.`);

    } catch (error) {
      console.error("[Fixed Download] Download failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to download fixed images");
    } finally {
      setDownloadingAllImages(false);
      setTimeout(() => setDownloadProgress(null), 3000);
    }
  }

  async function downloadAllStudentImages() {
    try {
      setDownloadingAllImages(true);
      setDownloadProgress({ current: 0, total: 0, status: 'counting' });
      toast.info("Preparing download. Counting images first...", { duration: 5000 });

      const params = new URLSearchParams();
      if (selectedLGA && selectedLGA !== "all") params.append("lga", selectedLGA);
      if (schoolCodeInput) params.append("schoolCode", schoolCodeInput);
      if (registrationType && registrationType !== "all") params.append("registrationType", registrationType);

      // Step 1: Get total chunks info
      const infoParams = new URLSearchParams(params);
      infoParams.append("totalChunks", "true");

      console.log('[Download] Getting chunk info...');
      const infoRes = await fetch(`/api/admin/students/download-images?${infoParams.toString()}`);
      if (!infoRes.ok) {
        const error = await infoRes.json();
        throw new Error(error.error || 'Failed to get download info');
      }

      const { totalImages, totalChunks, chunkSize } = await infoRes.json();
      console.log(`[Download] Total images: ${totalImages}, Total chunks: ${totalChunks}, Chunk size: ${chunkSize}`);

      if (totalImages === 0) {
        toast.error("No images found to download");
        return;
      }

      toast.info(`Found ${totalImages.toLocaleString()} images. Will download in ${totalChunks} parts...`, { duration: 5000 });
      setDownloadProgress({ current: 0, total: totalChunks, status: 'downloading' });

      // Step 2: Download each chunk sequentially
      console.log(`[Download] Starting download of ${totalChunks} chunks...`);
      for (let i = 0; i < totalChunks; i++) {
        console.log(`[Download] Processing chunk ${i + 1} of ${totalChunks}`);
        setDownloadProgress({ current: i + 1, total: totalChunks, status: 'downloading' });

        const chunkParams = new URLSearchParams(params);
        chunkParams.append("chunk", i.toString());

        console.log(`[Download] Fetching chunk ${i + 1} with params: ${chunkParams.toString()}`);
        const response = await fetch(`/api/admin/students/download-images?${chunkParams.toString()}`);
        console.log(`[Download] Chunk ${i + 1} response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Download] Failed to download chunk ${i + 1}:`, errorText);
          toast.error(`Failed to download part ${i + 1} of ${totalChunks}`);
          continue;
        }

        const blob = await response.blob();
        console.log(`[Download] Chunk ${i + 1} blob size: ${blob.size} bytes`);
        const url = URL.createObjectURL(blob);

        // Get filename from headers or generate one
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
        const filename = filenameMatch ? filenameMatch[1] : `student_images_part${i + 1}of${totalChunks}.zip`;
        console.log(`[Download] Chunk ${i + 1} filename: ${filename}`);

        // Download the file
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`[Download] Chunk ${i + 1} download triggered`);

        // Small delay between downloads to prevent browser overload
        if (i < totalChunks - 1) {
          console.log(`[Download] Waiting 500ms before next chunk...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log('[Download] All chunks completed!');
      setDownloadProgress({ current: totalChunks, total: totalChunks, status: 'completed' });
      toast.success(`Downloaded all ${totalChunks} parts successfully! Check your downloads folder.`);

    } catch (error) {
      console.error("[Download] Download all images failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to download images");
    } finally {
      setDownloadingAllImages(false);
      setTimeout(() => setDownloadProgress(null), 3000);
    }
  }

  async function exportAsCSV() {
    try {
      setExportProgress(0);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedLGA && selectedLGA !== "all") params.append("lga", selectedLGA);
      if (schoolCodeInput) params.append("schoolCode", schoolCodeInput);
      if (registrationType && registrationType !== "all") params.append("registrationType", registrationType);

      // Single streaming request — server sends CSV in chunks like a file download
      const res = await fetch(`/api/admin/students/export?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const totalRecords = parseInt(res.headers.get("X-Total-Records") || "0");
      const estimatedSize = parseInt(res.headers.get("X-Estimated-Size") || "0");

      if (totalRecords === 0) {
        setExportProgress(null);
        toast.error("No students to export");
        return;
      }

      toast.info(`Downloading ${totalRecords.toLocaleString()} students...`, { duration: 5000 });

      // Read the stream chunk by chunk, tracking progress
      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        // Calculate progress % from estimated size
        if (estimatedSize > 0) {
          const pct = Math.min(Math.round((receivedBytes / estimatedSize) * 100), 99);
          setExportProgress(pct);
        }
      }

      setExportProgress(100);

      // Combine all chunks into a single blob and trigger download
      const blob = new Blob(chunks, { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${totalRecords.toLocaleString()} students successfully!`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please check your connection and try again.");
    } finally {
      setTimeout(() => setExportProgress(null), 2000);
    }
  }

  async function downloadAllImages() {
    // Filter students who have passport images
    if (safeStudents.length === 0) {
      toast.error("No student data available");
      return;
    }
    const studentsWithImages = safeStudents.filter(student => student.passport && student.passport.trim() !== "");

    if (studentsWithImages.length === 0) {
      toast.error("No student images found to download");
      return;
    }

    toast.info(`Preparing to download ${studentsWithImages.length} images...`);

    const zip = new JSZip();
    let successCount = 0;
    let errorCount = 0;

    // Fetch and add each image to the zip
    for (const student of studentsWithImages) {
      try {
        const response = await fetch(student.passport!);
        if (!response.ok) throw new Error("Failed to fetch image");

        const blob = await response.blob();

        // Get file extension from the URL or default to jpg
        let extension = "jpg";
        const urlParts = student.passport!.split(".");
        if (urlParts.length > 1) {
          const ext = urlParts[urlParts.length - 1].split("?")[0].toLowerCase();
          if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
            extension = ext;
          }
        }

        // Use student examination number as filename
        const filename = `${student.studentNumber}.${extension}`;
        zip.file(filename, blob);
        successCount++;
      } catch (error) {
        console.error(`Failed to download image for ${student.studentNumber}:`, error);
        errorCount++;
      }
    }

    if (successCount === 0) {
      toast.error("Failed to download any images");
      return;
    }

    // Generate and download the zip file
    try {
      toast.info("Creating zip file...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `student_images_${new Date().toISOString().split("T")[0]}.zip`);

      if (errorCount > 0) {
        toast.success(`Downloaded ${successCount} images successfully. ${errorCount} failed.`);
      } else {
        toast.success(`Successfully downloaded all ${successCount} images`);
      }
    } catch (error) {
      console.error("Failed to create zip file:", error);
      toast.error("Failed to create zip file");
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Search & Filter</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs sm:text-sm"
            >
              <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or exam number..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9 sm:pl-10 text-sm sm:text-base"
              />
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 border-t">
              <Select
                value={selectedLGA}
                onValueChange={(value) => {
                  setSelectedLGA(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px] text-sm sm:text-base">
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All LGAs</SelectItem>
                  {allLGAs.map(lga => (
                    <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-[200px]">
                <Input
                  placeholder="Enter school code..."
                  value={schoolCodeInput}
                  onChange={(e) => {
                    setSchoolCodeInput(e.target.value);
                    setPage(1);
                  }}
                  className="text-sm sm:text-base"
                />
              </div>

              <Select
                value={registrationType}
                onValueChange={(value) => {
                  setRegistrationType(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px] text-sm sm:text-base">
                  <SelectValue placeholder="Registration Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="post">Post</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedLGA("all");
                  setSchoolCodeInput("");
                  setRegistrationType("all");
                  setPage(1);
                }}
                className="text-xs sm:text-sm"
              >
                Clear Filters
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
                onClick={exportAsCSV}
                disabled={exportProgress !== null}
              >
                <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {exportProgress !== null ? `Exporting... ${exportProgress}%` : "Export Data"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
                onClick={downloadAllImages}
              >
                <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Download Page Images
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
                onClick={downloadAllStudentImages}
                disabled={downloadingAllImages}
              >
                <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {downloadingAllImages
                  ? downloadProgress
                    ? downloadProgress.status === 'counting'
                      ? "Counting images..."
                      : `Downloading part ${downloadProgress.current}/${downloadProgress.total}...`
                    : "Downloading..."
                  : "Download ALL Images"}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs sm:text-sm bg-purple-600 hover:bg-purple-700"
                onClick={downloadFixedImages}
                disabled={downloadingAllImages}
              >
                <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {downloadingAllImages
                  ? downloadProgress
                    ? downloadProgress.status === 'counting'
                      ? "Counting fixed images..."
                      : `Downloading fixed part ${downloadProgress.current}/${downloadProgress.total}...`
                    : "Downloading..."
                  : "Download Fixed Images (047/058)"}
              </Button>
            </div>
            {exportProgress !== null && (
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            )}
            {downloadProgress !== null && (
              <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress.total > 0 ? (downloadProgress.current / downloadProgress.total) * 100 : 0}%` }}
                />
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 text-center">
                  {downloadProgress.status === 'counting'
                    ? 'Counting images...'
                    : downloadProgress.status === 'completed'
                    ? 'Download complete!'
                    : `Part ${downloadProgress.current} of ${downloadProgress.total}`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden w-full">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base sm:text-lg">Registered Students ({pagination.total})</CardTitle>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={loading || page <= 1}
                  className="text-xs sm:text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={loading || page >= pagination.totalPages}
                  className="text-xs sm:text-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  const nextLimit = parseInt(value, 10);
                  setLimit(Number.isFinite(nextLimit) ? nextLimit : 100);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[140px] text-sm sm:text-base">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                  <SelectItem value="200">200 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {safeStudents.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No students found</p>
          ) : (
            <div className="overflow-x-auto w-full" style={{ maxWidth: '100%' }}>
              <div className="inline-block min-w-full align-middle">
                <Table className="w-full table-fixed text-xs sm:text-sm" style={{ minWidth: '1800px' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] border-r">Year</TableHead>
                      <TableHead className="w-[60px] border-r-2">PRCD</TableHead>
                      <TableHead className="w-[80px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Photo</TableHead>
                      <TableHead className="w-[150px] sticky left-[80px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Student Number</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[150px]">Access Code</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Other Name</TableHead>
                      <TableHead>Surname</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>School Type</TableHead>
                      <TableHead colSpan={3} className="text-center border-l-2">English</TableHead>
                      <TableHead colSpan={3} className="text-center border-l-2">Arithmetic</TableHead>
                      <TableHead colSpan={3} className="text-center border-l-2">General Paper</TableHead>
                      <TableHead colSpan={4} className="text-center border-l-2">Religious Studies</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="border-r"></TableHead>
                      <TableHead className="border-r-2"></TableHead>
                      <TableHead className="sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></TableHead>
                      <TableHead className="sticky left-[80px] bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
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
                    {safeStudents.map((student) => {
                      const initials = `${student.lastname[0]}${student.firstname[0]}`
                        .toUpperCase();

                      return (
                        <TableRow key={student.id} className="group hover:bg-muted/50">
                          <TableCell className="border-r">{"2025/2026"}</TableCell>
                          <TableCell className="border-r-2">{student.prcd || 1}</TableCell>
                          <TableCell className="sticky left-0 bg-background group-hover:bg-muted/50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={student.passport || ""}
                                alt={`${student.lastname} ${student.firstname}`}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {initials || <User className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium sticky left-[80px] bg-background group-hover:bg-muted/50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{student.studentNumber}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${student.registrationType === 'post'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : student.registrationType === 'late'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              }`}>
                              {student.registrationType === 'post' ? 'Post' : student.registrationType === 'late' ? 'Late' : 'Regular'}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{student.accCode}</TableCell>
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
