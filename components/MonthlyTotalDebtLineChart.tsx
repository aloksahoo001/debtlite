import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

type Payment = {
  remaining_amount: number;
  payment_date: string;
  monthly_payables: {
    payee: string;
  };
};

export default function MonthlyTotalDebtLineChart() {
  const supabase = createClient();
  const [chartData, setChartData] = useState<any>(null);
  const [payee, setPayee] = useState<string>("all");
  const [payees, setPayees] = useState<string[]>([]);

  const fetchData = async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const { data, error } = await supabase
      .from("payments")
      .select("remaining_amount, payment_date, monthly_payables(payee)")
      .gte("payment_date", sixMonthsAgo.toISOString());

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    // Step 1: Extract all payees before filtering
    const payeeSet = new Set<string>();
    (data ?? []).forEach((d: any) => {
      const payeeName = d.monthly_payables?.payee;
      if (payeeName) {
        payeeSet.add(payeeName);
      }
    });
    setPayees(Array.from(payeeSet).sort()); // Optional: sort alphabetically

    // Step 2: Convert to type-safe Payment[]
    const payments: Payment[] = (data ?? []).map((d: any) => ({
      remaining_amount: d.remaining_amount,
      payment_date: d.payment_date,
      monthly_payables: d.monthly_payables,
    }));

    // Step 3: Apply filter
    const filtered = payments.filter((p) => {
      return payee === "all" || p.monthly_payables?.payee === payee;
    });

    // Step 4: Group by month
    const grouped: Record<string, number> = {};
    filtered.forEach((p) => {
      const date = new Date(p.payment_date);
      const monthLabel = `${date.toLocaleString("en-US", {
        month: "short",
      })} ${date.getFullYear()}`;

      grouped[monthLabel] = (grouped[monthLabel] || 0) + p.remaining_amount;
    });

    const months = Object.keys(grouped).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Step 5: Set chart data
    setChartData({
      labels: months,
      datasets: [
        {
          label: "Total Remaining Debt",
          data: months.map((month) => grouped[month]),
          borderColor: "#3b82f6",
          backgroundColor: "#93c5fd",
          fill: false,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    });
  };

  useEffect(() => {
    fetchData();
  }, [payee]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <CardTitle className="text-base md:text-lg">
          Total Remaining Debt (Last 6 Months)
        </CardTitle>
        <Select value={payee} onValueChange={setPayee}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Payee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payees</SelectItem>
            {payees.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {chartData ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Total Debt Remaining",
                  },
                },
                x: {
                  title: {
                    display: true,
                    text: "Month",
                  },
                },
              },
            }}
            height={200}
          />
        ) : (
          <div className="text-sm text-muted-foreground">Loading chart...</div>
        )}
      </CardContent>
    </Card>
  );
}