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
  remaining_amount: number;
  payment_date: string;
  monthly_payables: { type: string };
};

export default function MonthlyRemaingDebtChart() {
  const supabase = createClient();
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

      const { data, error } = await supabase
        .from("payments")
        .select("remaining_amount, payment_date, monthly_payables(type)")
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
          (grouped[monthLabel][type] || 0) + payment.remaining_amount;
      });

      const months = Object.keys(grouped).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );
      const types = Array.from(typeSet);
      const colors = [
        "#fdba74",
        "#fde68a",
        "#ddd6fe",
        "#a5b4fc",
        "#bbf7d0",
        "#fca5a5",
        
      ];

      const datasets = types.map((type, i) => ({
        label: type,
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
          Remaining Debt After Payment (Last 6 Months)
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
                    text: "Debt Remaining Amount",
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
