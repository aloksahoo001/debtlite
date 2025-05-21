"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { Pie, Line } from "react-chartjs-2";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

const samplePayments = [
  { date: "2025-05-03", amount: 140000 },
  { date: "2025-05-06", amount: 190000 },
  { date: "2025-05-09", amount: 175000 },
  { date: "2025-05-12", amount: 160000 },
  { date: "2025-05-15", amount: 180000 },
];

// Subtle Pie Data: Payable Type Breakdown
const pieData1 = {
  labels: ["EMI", "Loan", "Credit Card"],
  datasets: [
    {
      label: "Amount",
      data: [8000, 6000, 3000],
      backgroundColor: ["#a5b4fc", "#bbf7d0", "#fde68a"], // subtle tones
      borderWidth: 1,
    },
  ],
};

// Subtle Pie Data: Principal vs Interest
const pieData2 = {
  labels: ["Principal", "Interest/Extra"],
  datasets: [
    {
      label: "Breakup",
      data: [22000, 5000],
      backgroundColor: ["#93c5fd", "#fbcfe8"], // light blue and pink
      borderWidth: 1,
    },
  ],
};

// Subtle Line Chart: Debt Snapshot
const lineData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [
    {
      label: "Debt Snapshot",
      data: [2500000, 2100000, 2300000, 1900000, 2200000],
      borderColor: "#c7d2fe", // soft lavender
      backgroundColor: "#c7d2fe80", // translucent fill
      tension: 0.4,
    },
  ],
};

const lineOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
};

export default function DashboardPage() {
  return (
    <div className="grid gap-4 p-4 md:p-6 max-w-screen-xl mx-auto">
      {/* Upcoming Payment (Full Width) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Due in 3 days (May 23, 2025)
              </p>
              <p className="text-base font-semibold">Car Loan EMI</p>
            </div>
            <p className="text-xl font-bold text-primary">₹4,500</p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Paid (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">₹9,500</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>To Be Paid (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-rose-600">₹12,500</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Pie Charts Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Payable Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-full max-w-xs">
              <Pie data={pieData1} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Principal vs Interest</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-full max-w-xs">
              <Pie data={pieData2} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debt Snapshot Over Time (Full Width) */}
      <Card>
        <CardHeader>
          <CardTitle>Debt Snapshot Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Line data={lineData} options={lineOptions} />
        </CardContent>
      </Card>

      {/* Grouped Total Payable By Date (Full Width Table) */}
      <Card>
        <CardHeader>
          <CardTitle>Total Amount Payable by Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-80 rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samplePayments.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.amount.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
