"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart, TrendingUp } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

type Props = {
  monthlyPayableId: string;
  payableTitle: string;
};

export const PayableChartDialog = ({
  monthlyPayableId,
  payableTitle,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataPoints, setDataPoints] = useState<
    { payment_date: string; amount: number; extra_pay?: number }[]
  >([]);

  const supabase = createClient();

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("payment_date, amount_paid, extra_amount")
      .eq("monthly_payable_id", monthlyPayableId)
      .order("payment_date", { ascending: true });

    if (!error && data) {
      setDataPoints(
        data.map((d) => ({
          payment_date: d.payment_date,
          amount: d.amount_paid ?? 0,
          extra_pay: d.extra_amount ?? 0,
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchPayments();
  }, [open]);

  const chartData = {
    labels: dataPoints.map((p) => format(new Date(p.payment_date), "dd-MMM")),
    datasets: [
      {
        label: "Amount Paid (₹)",
        data: dataPoints.map((p) => p.amount),
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: "EMI Payments Over Time",
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const index = context.dataIndex;
            const amount = dataPoints[index]?.amount || 0;
            const extra = dataPoints[index]?.extra_pay || 0;
            const base = `Amount Paid: ₹${amount.toLocaleString()}`;
            const extraLine =
              extra > 0 ? `, Extra Pay: ₹${extra.toLocaleString()}` : "";
            return base + extraLine;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback(this: any, tickValue: string | number) {
            if (typeof tickValue === "number") {
              return `₹${tickValue.toLocaleString()}`;
            }
            return tickValue;
          },
        },
      },
    },
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 py-0">
          <TrendingUp/>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>EMI Trend: {payableTitle}</DialogTitle>
        </DialogHeader>
        <div className="h-72 w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : dataPoints.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No payments yet.
            </div>
          ) : (
            <Line data={chartData} options={chartOptions}/>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
