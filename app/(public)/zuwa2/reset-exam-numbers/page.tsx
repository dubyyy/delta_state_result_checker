"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { RefreshCw, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import schoolsJsonData from "@/data.json";
import { LGA_MAPPING } from "@/lib/lga-mapping";

interface SchoolJsonEntry {
  lgaCode: string;
  lCode: string;
  schCode: string;
  progID: string;
  schName: string;
  id: string;
}

export default function ResetExamNumbersPage() {
  const [resetLga, setResetLga] = useState<string>("all");
  const [resetSchoolCode, setResetSchoolCode] = useState("");
  const [lgaOpen, setLgaOpen] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{
    message: string;
    preview?: { name: string; old: string; new: string }[];
  } | null>(null);
  const [resetEverythingLoading, setResetEverythingLoading] = useState(false);
  const [resetEverythingResult, setResetEverythingResult] = useState<{
    message: string;
    results?: any;
  } | null>(null);
  const [resetProgress, setResetProgress] = useState<{
    percent: number;
    message: string;
    step: string;
  } | null>(null);

  // Get unique LGA codes from data.json, paired with their names
  const lgaOptions = Object.entries(
    (schoolsJsonData as SchoolJsonEntry[]).reduce<Record<string, string>>((acc, s) => {
      if (!acc[s.lCode]) {
        acc[s.lCode] = LGA_MAPPING[s.lCode] || s.lCode;
      }
      return acc;
    }, {})
  ).sort((a, b) => a[1].localeCompare(b[1]));

  // Get available schools for selected LGA from data.json
  const availableSchools =
    resetLga !== "all"
      ? (schoolsJsonData as SchoolJsonEntry[]).filter((s) => s.lCode === resetLga)
      : [];

  const handleResetExamNumbers = async () => {
    if (resetLga === "all" || !resetSchoolCode) {
      toast.error("Please select an LGA and a school");
      return;
    }

    setResetLoading(true);
    setResetResult(null);
    try {
      const res = await fetch("/api/admin/reset-exam-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lgaCode: resetLga, schoolCode: resetSchoolCode }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Exam numbers reset successfully");
        setResetResult({ message: data.message, preview: data.preview });
      } else {
        toast.error(data.error || "Failed to reset exam numbers");
      }
    } catch (error) {
      console.error("Error resetting exam numbers:", error);
      toast.error("An error occurred while resetting exam numbers");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetEverything = async () => {
    setResetEverythingLoading(true);
    setResetEverythingResult(null);
    setResetProgress({ percent: 0, message: "Starting...", step: "init" });
    try {
      const res = await fetch("/api/admin/reset-all-exam-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "RESET_ALL_EXAM_NUMBERS" }),
      });

      if (!res.body) {
        toast.error("No response stream received");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "progress") {
                setResetProgress({
                  percent: data.percent || 0,
                  message: data.message || "",
                  step: data.step || "",
                });
              } else if (currentEvent === "done") {
                setResetProgress({ percent: 100, message: "Complete!", step: "done" });
                toast.success(data.message || "Reset completed successfully");
                setResetEverythingResult({ message: data.message, results: data.results });
                setResetLga("all");
                setResetSchoolCode("");
                setResetResult(null);
              } else if (currentEvent === "error") {
                toast.error(data.error || "Failed to reset exam numbers");
                setResetProgress(null);
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("Error resetting everything:", error);
      toast.error("An error occurred while resetting everything");
      setResetProgress(null);
    } finally {
      setResetEverythingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Reset Exam Numbers
        </h2>
        <p className="text-muted-foreground mt-1">
          Recompute the last 4 digits of student exam numbers for a school,
          re-sorting alphabetically by surname then first name (0001, 0002, ...)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select School</CardTitle>
          <CardDescription>
            Choose an LGA and school to reset exam number sequencing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              LGA &amp; School
            </Label>
            <div className="flex gap-2 flex-wrap">
              <Popover open={lgaOpen} onOpenChange={setLgaOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={lgaOpen}
                    className="w-[220px] justify-between"
                  >
                    {resetLga !== "all"
                      ? lgaOptions.find(([code]) => code === resetLga)?.[1] ?? "Select LGA"
                      : "Select LGA"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0">
                  <Command>
                    <CommandInput placeholder="Search LGA..." />
                    <CommandList>
                      <CommandEmpty>No LGA found.</CommandEmpty>
                      <CommandGroup>
                        {lgaOptions.map(([code, name]) => (
                          <CommandItem
                            key={code}
                            value={name}
                            onSelect={() => {
                              setResetLga(code);
                              setResetSchoolCode("");
                              setResetResult(null);
                              setLgaOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                resetLga === code ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {resetLga !== "all" && availableSchools.length > 0 ? (
                <Popover open={schoolOpen} onOpenChange={setSchoolOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={schoolOpen}
                      className="flex-1 min-w-[250px] justify-between"
                    >
                      {resetSchoolCode
                        ? (() => {
                            const found = availableSchools.find(
                              (s) => s.schCode === resetSchoolCode
                            );
                            return found
                              ? `${found.schCode} - ${found.schName}`
                              : "Select School";
                          })()
                        : "Select School"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search school..." />
                      <CommandList>
                        <CommandEmpty>No school found.</CommandEmpty>
                        <CommandGroup>
                          {availableSchools.map((s) => (
                            <CommandItem
                              key={s.schCode}
                              value={`${s.schCode} ${s.schName}`}
                              onSelect={() => {
                                setResetSchoolCode(s.schCode);
                                setSchoolOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  resetSchoolCode === s.schCode
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {s.schCode} - {s.schName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <Input
                  placeholder="Enter School Code"
                  value={resetSchoolCode}
                  onChange={(e) => setResetSchoolCode(e.target.value)}
                  className="flex-1 min-w-[200px]"
                />
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    disabled={
                      resetLga === "all" || !resetSchoolCode || resetLoading
                    }
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${resetLoading ? "animate-spin" : ""}`}
                    />
                    {resetLoading ? "Resetting..." : "Reset Numbers"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Exam Numbers</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will recompute the last 4 digits of all student exam
                      numbers for school code{" "}
                      <strong>{resetSchoolCode}</strong>, re-sorting them
                      alphabetically. Existing exam numbers will be overwritten.
                      Are you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetExamNumbers}>
                      Reset Numbers
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {resetResult && (
              <div className="rounded-lg border p-4 space-y-2 mt-3">
                <p className="text-sm font-medium text-green-600">
                  {resetResult.message}
                </p>
                {resetResult.preview && resetResult.preview.length > 0 && (
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-muted-foreground">
                      Preview (first 10):
                    </p>
                    {resetResult.preview.map((p, i) => (
                      <p key={i} className="text-muted-foreground">
                        {p.name}:{" "}
                        <span className="line-through">{p.old}</span>{" "}
                        &rarr;{" "}
                        <span className="font-mono font-bold">{p.new}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Reset All Exam Numbers
          </CardTitle>
          <CardDescription className="text-orange-600">
            Reset exam numbers for all schools in the system:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Recomputes exam numbers for all schools</li>
              <li>Re-sorts students alphabetically by surname then first name</li>
              <li>Assigns sequential numbers (0001, 0002, ...)</li>
            </ul>
            This will affect all schools but preserves all other data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  disabled={resetEverythingLoading}
                  className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${resetEverythingLoading ? "animate-spin" : ""}`}
                  />
                  {resetEverythingLoading ? "Resetting All..." : "Reset All Exam Numbers"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-orange-600">
                    Reset All Exam Numbers
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset exam numbers for all schools in the system:
                    <br /><br />
                    <strong>All exam numbers will be recomputed for all schools</strong><br />
                    <strong>Students will be re-sorted alphabetically by surname then first name</strong><br />
                    <strong>New sequential numbers will be assigned (0001, 0002, ...)</strong><br />
                    <br />
                    This action will affect all schools but preserves all other data including passwords, registration status, results, and student information.
                    Are you sure you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetEverything}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Reset All Exam Numbers
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {resetEverythingLoading && resetProgress && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3 mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-orange-800">
                    {resetProgress.step === "loading" && "Loading data..."}
                    {resetProgress.step === "processing" && "Processing schools..."}
                    {resetProgress.step === "updating" && "Updating database..."}
                    {resetProgress.step === "done" && "Complete!"}
                    {resetProgress.step === "init" && "Starting..."}
                  </span>
                  <span className="text-orange-600 font-mono text-xs">
                    {resetProgress.percent}%
                  </span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${resetProgress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-orange-700">
                  {resetProgress.message}
                </p>
              </div>
            )}

            {resetEverythingResult && !resetEverythingLoading && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2 mt-3">
                <p className="text-sm font-medium text-green-800">
                  {resetEverythingResult.message}
                </p>
                {resetEverythingResult.results && (
                  <div className="text-xs space-y-1 text-green-700">
                    <p className="font-semibold">Reset Summary:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Schools processed: {resetEverythingResult.results.schoolsProcessed}</li>
                      {resetEverythingResult.results.schoolsSkipped > 0 && (
                        <li>Schools skipped (no data): {resetEverythingResult.results.schoolsSkipped}</li>
                      )}
                      <li>Exam numbers reset: {resetEverythingResult.results.examNumbersReset}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
