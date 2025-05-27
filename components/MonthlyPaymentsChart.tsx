import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Payment = {
  amount_paid: number;
  payment_date: string;
  monthly_payables: { type: string };
};

export default function MonthlyPaymentsChart() {
  const supabase = createClient();
  const [chartData, setChartData] = useState<any>(null);

  const typeLabels: Record<string, string> = {
    emi: "EMI",
    loan: "Loan Interest",
    credit_card: "Credit Card",
    pay_later: "Pay Later",
    bill: "Bills",
    rent: "Rent",
    Total: "Total", // Added for display
  };
  
  useEffect(() => {
    const fetchData = async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  
      const { data, error } = await supabase
        .from("payments")
        .select("amount_paid, payment_date, monthly_payables(type)")
        .gte("payment_date", sixMonthsAgo.toISOString());
  
      if (error) {
        console.error("Fetch error:", error);
        return;
      }
  
      const grouped: Record<string, Record<string, number>> = {};
      const typeSet = new Set<string>();
  
      data?.forEach((p: unknown) => {
        const payment = p as Payment;
        const date = new Date(payment.payment_date);
        const monthLabel = `${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}`;
        const type = payment.monthly_payables?.type ?? "Unknown";
  
        typeSet.add(type);
        if (!grouped[monthLabel]) grouped[monthLabel] = {};
        grouped[monthLabel][type] =
          (grouped[monthLabel][type] || 0) + payment.amount_paid;
      });
  
      // Add total per month
      for (const month of Object.keys(grouped)) {
        grouped[month]["Total"] = Object.values(grouped[month]).reduce(
          (sum, val) => sum + val,
          0
        );
      }
  
      const months = Object.keys(grouped).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );
  
      // Compute total per type including "Total"
      const typeTotals: Record<string, number> = {};
      for (const month of Object.values(grouped)) {
        for (const [type, amount] of Object.entries(month)) {
          typeTotals[type] = (typeTotals[type] || 0) + amount;
        }
      }
  
      // Sort types by descending total paid
      const types = Object.entries(typeTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([type]) => type);
  
      const colors = [
        "#a5b4fc",
        "#bbf7d0",
        "#fde68a",
        "#fca5a5",
        "#fdba74",
        "#ddd6fe",
        "#94a3b8", // extra colors for additional types
        "#fcd34d",
        "#f87171",
        "#6ee7b7",
      ];
  
      const datasets = types.map((type, i) => ({
        label: typeLabels[type] || type,
        backgroundColor: colors[i % colors.length],
        data: months.map((month) => grouped[month]?.[type] || 0),
      }));
  
      setChartData({
        labels: months,
        datasets,
      });
    };
  
    fetchData();
  }, []);
  

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">
          Monthly Paid by Type (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData ? (
          <Bar
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
                    text: "Amount Paid",
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
          />
        ) : (
          <div className="text-sm text-muted-foreground">Loading chart...</div>
        )}
      </CardContent>
    </Card>
  );
}
