import { StatsCard } from "@/components/StatsCard";
import { Users, School, FileCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const stats = [
  {
    title: "Total Students",
    value: "2,847",
    icon: Users,
    trend: { value: "+12% from last month", isPositive: true },
  },
  {
    title: "Total Schools",
    value: "34",
    icon: School,
    trend: { value: "+2 new schools", isPositive: true },
  },
  {
    title: "Registrations Today",
    value: "143",
    icon: FileCheck,
    trend: { value: "+8% from yesterday", isPositive: true },
  },
  {
    title: "Registration Status",
    value: "Open",
    icon: TrendingUp,
  },
];

const lgaData = [
  { lga: "Aba North", students: 342, schools: 5 },
  { lga: "Aba South", students: 428, schools: 6 },
  { lga: "Arochukwu", students: 186, schools: 3 },
  { lga: "Bende", students: 294, schools: 4 },
  { lga: "Ikwuano", students: 157, schools: 2 },
  { lga: "Isiala Ngwa North", students: 381, schools: 5 },
  { lga: "Isiala Ngwa South", students: 315, schools: 4 },
  { lga: "Umuahia North", students: 401, schools: 5 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">
          Quick overview of student registrations and school statistics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students by Local Government</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Local Government</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Schools</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lgaData.map((row) => (
                <TableRow key={row.lga} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{row.lga}</TableCell>
                  <TableCell className="text-right">{row.students}</TableCell>
                  <TableCell className="text-right">{row.schools}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
