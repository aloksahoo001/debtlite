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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
  monthly_payables: { type: string };
};

export default function MonthlyTotalDebtLineChart() {
  const supabase = createClient();
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

      const { data, error } = await supabase
        .from("payments")
        .select("remaining_amount, payment_date")
        .gte("payment_date", sixMonthsAgo.toISOString());

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      // Group remaining_amount by month
      const grouped: Record<string, number> = {};

      data?.forEach((p: unknown) => {
        const payment = p as Payment;
        const date = new Date(payment.payment_date);
        const monthLabel = `${date.toLocaleString("en-US", {
          month: "short",
        })} ${date.getFullYear()}`;

        grouped[monthLabel] = (grouped[monthLabel] || 0) + payment.remaining_amount;
      });

      const months = Object.keys(grouped).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

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

    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">
          Total Remaining Debt (Last 6 Months)
        </CardTitle>
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
          />
        ) : (
          <div className="text-sm text-muted-foreground">Loading chart...</div>
        )}
      </CardContent>
    </Card>
  );
}