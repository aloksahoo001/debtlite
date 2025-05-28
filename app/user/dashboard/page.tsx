"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isSameMonth } from "date-fns";
import { ChevronRight } from "lucide-react";
import MonthlyPaymentsChart from "@/components/MonthlyPaymentsChart";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import MonthlyRemaingDebtChart from "@/components/MonthlyRemainingDebtChart";
import MonthlyTotalDebtLineChart from "@/components/MonthlyTotalDebtLineChart";

ChartJS.register(ArcElement, Tooltip, Legend);

function formatINR(amount: number) {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

type Payable = {
  id: string;
  title: string;
  emi_day: number;
  emi_amount: number;
  extra_pay: number;
  pay_type: string;
  type: string;
};

type Payment = {
  monthly_payable_id: string;
  payment_date: string;
};

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<
    Array<{ date: string; total: number; items: Payable[] }>
  >([]);
  const [payStats, setPayStats] = useState({
    paid: 0,
    unpaid: 0,
    totalPayableAmount: 0,
    totalPaybles: 0,
  });
  const [principalExtra, setPrincipalExtra] = useState({
    principal: 0,
    extra: 0,
  });
  const [typeBreakdown, setTypeBreakdown] = useState<Record<string, number>>(
    {}
  );
  const [typeRemainingBreakdown, setTypeRemainingBreakdown] = useState<
    Record<string, number>
  >({});
  const [extraPayableData, setExtraPayableData] = useState<{
    total: number;
    byPayee: { payee: string; total_extra_pay: number }[];
  }>({
    total: 0,
    byPayee: [],
  });
  const [emiData, setEmiData] = useState<{
    totalEmi: number;
    emiByPayee: { payee: string; total_emi_amount: number }[];
  }>({
    totalEmi: 0,
    emiByPayee: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    const { data: payablesRaw } = await supabase
      .from("monthly_payables")
      .select("*");

    const { data: paymentsRaw } = await supabase.from("payments").select("*");

    const payables = payablesRaw ?? [];
    const payments = paymentsRaw ?? [];

    const today = new Date();
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    // 1. Upcoming Payables
    const upcomingPayables = (payables ?? [])
      .map((p) => {
        const emiDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          p.emi_day
        );

        // If emi_day < today and it's already passed this month, assume it's for next month
        if (p.emi_day < today.getDate()) {
          emiDate.setMonth(emiDate.getMonth() + 1);
        }

        return { ...p, emiDate };
      })
      .filter((p) => {
        const pDate = p.emiDate;
        return pDate.toDateString() === today.toDateString() || pDate > today;
      })
      .sort((a, b) => a.emiDate.getTime() - b.emiDate.getTime());

    // Group by emiDate (actual Date)
    const groupedByDate: Record<string, Payable[]> = {};
    upcomingPayables.forEach((p) => {
      const key = p.emiDate.toDateString(); // ensures proper grouping by full date
      groupedByDate[key] = [...(groupedByDate[key] || []), p];
    });

    // Pick today’s payments and the next distinct date (if any)
    const allDates = Object.keys(groupedByDate).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const finalGroups = allDates
      .filter((d) => new Date(d) >= today) // only today or future
      .slice(0, 5);

    const result = finalGroups.map((dateKey) => {
      const items = groupedByDate[dateKey];
      const total = items.reduce((sum, p) => sum + p.emi_amount, 0);
      return {
        date: format(new Date(dateKey), "MMM dd, yyyy"),
        total,
        items,
      };
    });

    setUpcoming(result);

    // 2. Paid / Unpaid This Month
    const thisMonthPayments = (payments ?? []).filter((p) =>
      isSameMonth(new Date(p.payment_date), today)
    );

    const paidSet = new Set(thisMonthPayments.map((p) => p.monthly_payable_id));

    const paid = thisMonthPayments.reduce((acc, p) => acc + p.amount_paid, 0);

    let unpaid = 0;
    let totalPayableAmount = 0;
    let totalPaybles = payables.length;
    (payables ?? []).forEach((p) => {
      const dueDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        p.emi_day
      );
      if (dueDate >= currentMonthStart) {
        if (!paidSet.has(p.id)) unpaid += p.emi_amount;
      }
      totalPayableAmount += p.emi_amount;
    });

    setPayStats({ paid, unpaid, totalPayableAmount, totalPaybles });

    // 3. Principal vs Extra (excluding bill/rent)
    const emiPayables = (payables ?? []).filter(
      (p) => p.type !== "bill" && p.type !== "rent"
    );
    const totalPrincipal = emiPayables.reduce(
      (sum, p) => sum + (p.emi_amount - (p.extra_pay || 0)),
      0
    );
    const totalExtra = emiPayables.reduce(
      (sum, p) => sum + (p.extra_pay || 0),
      0
    );
    setPrincipalExtra({ principal: totalPrincipal, extra: totalExtra });

    // 4. Type Breakdown
    const breakdown: Record<string, number> = {};
    (payables ?? []).forEach((p) => {
      const dueDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        p.emi_day
      );
      if (dueDate >= currentMonthStart) {
        const typeLabels: Record<string, string> = {
          emi: "EMI",
          loan: "Loan Interest",
          credit_card: "Credit Card",
          pay_later: "Pay Later",
          bill: "Bills",
          rent: "Rent",
        };

        const type = typeLabels[p.type] || p.type;
        breakdown[type] = (breakdown[type] || 0) + p.emi_amount;
      }
    });
    setTypeBreakdown(breakdown);

    // 5. Type Breakdown Remaining
    const remainingBreakdown: Record<string, number> = {};
    (payables ?? []).forEach((p) => {
      const dueDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        p.emi_day
      );
      if (dueDate >= currentMonthStart) {
        remainingBreakdown[p.type] =
          (remainingBreakdown[p.type] || 0) + p.remaining_amount;
      }
    });
    setTypeRemainingBreakdown(remainingBreakdown);

    // 6. Group and sum extra_pay by payee
    const payeeMap: Record<string, number> = {};
    for (const row of payables) {
      const { payee, extra_pay } = row;
      if (!payee) continue; // skip if payee is null/undefined
      if (!payeeMap[payee]) {
        payeeMap[payee] = 0;
      }
      payeeMap[payee] += extra_pay || 0;
    }
    const byPayee = Object.entries(payeeMap).map(
      ([payee, total_extra_pay]) => ({
        payee,
        total_extra_pay,
      })
    );
    const total = byPayee.reduce(
      (sum, { total_extra_pay }) => sum + total_extra_pay,
      0
    );
    setExtraPayableData({ total, byPayee });

    //7. Group and sum Obligations(EMI) by payee
    const payeeEmiMap: Record<string, number> = {};

    for (const row of payables) {
      if (row.type !== "emi" || !row.payee) continue;
      payeeEmiMap[row.payee] =
        (payeeEmiMap[row.payee] ?? 0) + (row.emi_amount ?? 0);
    }

    const emiByPayee = Object.entries(payeeEmiMap).map(
      ([payee, total_emi_amount]) => ({
        payee,
        total_emi_amount,
      })
    );
    emiByPayee.sort((a, b) => a.payee.localeCompare(b.payee));

    const totalEmi = emiByPayee.reduce(
      (sum, { total_emi_amount }) => sum + total_emi_amount,
      0
    );

    setEmiData({ totalEmi, emiByPayee });

    setLoading(false);
  }

  return (
    <div className="grid gap-4 p-4 max-w-screen-xl mx-auto">
      {/* Upcoming Payment */}
      {loading ? (
        <Card>
          <CardHeader className="py-2 pt-5">
            <CardTitle className="text-lg">Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent className="px-1 py-2 justify-center grid">
            <Carousel className="w-full max-w-sm md:max-w-4xl">
              <CarouselContent className="p-0">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <CarouselItem key={idx} className="max-w-[300px]">
                    <div className="p-1">
                      <div className="min-h-[240px] min-w-[280px] md:max-w-[300px] bg-muted p-4 rounded-xl shadow-sm border space-y-2">
                        <Skeleton className="h-4 w-1/3" />{" "}
                        {/* Due Date Skeleton */}
                        <div className="space-y-1">
                          {Array.from({ length: 3 }).map((__, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center py-1"
                            >
                              <Skeleton className="h-4 w-2/3" />
                              <Skeleton className="h-4 w-1/4" />
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 flex justify-end">
                          <Skeleton className="h-4 w-1/3" />{" "}
                          {/* Total Skeleton */}
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="invisible md:visible" />
              <CarouselNext className="invisible md:visible" />
            </Carousel>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="py-2 pt-5">
            <CardTitle className="text-lg">Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent className="px-1 py-2 justify-center grid">
            <Carousel className="w-full max-w-sm md:max-w-4xl">
              <CarouselContent className="p-0">
                {upcoming.map((group, idx) => (
                  <CarouselItem key={idx} className="max-w-[300px]">
                    <div className="p-1">
                      <div className="min-h-[240px]  min-w-[280px] md:max-w-[300px] bg-muted p-4 rounded-xl shadow-sm border">
                        <p className="text-sm text-muted-foreground font-semibold">
                          Due on {group.date}
                        </p>
                        {group.items.map((item, i) => (
                          <div
                            key={item.id}
                            className="text-sm flex justify-between border-b py-1"
                          >
                            <span>
                              {i + 1}. {item.title}
                            </span>
                            <span>{formatINR(item.emi_amount)}</span>
                          </div>
                        ))}
                        <div className="pt-2 text-sm font-semibold text-right">
                          Total: {formatINR(group.total)}
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="invisible md:visible" />
              <CarouselNext className="invisible md:visible" />
            </Carousel>
          </CardContent>
        </Card>
      )}

      {/* Paid / Unpaid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total ({format(new Date(), "MMM-yyyy")})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          {[
          {
            label: "Total Payable",
            value: payStats.totalPayableAmount,
            color: "text-gray-600",
          },
          {
            label: "Total Paid",
            value: payStats.paid,
            color: "text-green-600",
          },
          {
            label: "Yet To Pay",
            value: payStats.unpaid,
            color: "text-rose-600",
          },
        ].map(({ label, value, color }, idx) => (
              <div
                key={label}
                className="flex justify-between text-md font-semibold text-gray-500 border-b pb-2"
              >
                <span>
                  {label}
                </span>
                <span className={`text-xl font-semibold ${color}`}>{formatINR(value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total EMI Obligations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {emiData.emiByPayee.map((p, index) => (
              <div
                key={p.payee}
                className="flex justify-between text-sm font-semibold text-gray-500 border-b pb-2"
              >
                <span>
                  {index + 1}. {p.payee}
                </span>
                <span>{formatINR(p.total_emi_amount)}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{formatINR(emiData.totalEmi)}</span>
          </CardFooter>
        </Card>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payable Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payable Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {loading ? (
              <Skeleton className="w-[220px] h-[220px] rounded-full" />
            ) : (
              <div className="w-full max-w-xs">
                <Pie
                  data={{
                    labels: Object.keys(typeBreakdown),
                    datasets: [
                      {
                        label: "Payables",
                        data: Object.values(typeBreakdown),
                        backgroundColor: [
                          "#a5b4fc", // soft indigo
                          "#bbf7d0", // soft green
                          "#fde68a", // soft yellow
                          "#fca5a5", // soft red
                          "#fdba74", // soft orange
                          "#c4b5fd", // soft sky blue
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Principal vs Extra */}
        <Card>
          <CardHeader>
            <CardTitle>Principal vs Extra</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {loading ? (
              <Skeleton className="w-[220px] h-[220px] rounded-full" />
            ) : (
              <div className="w-full max-w-xs">
                <Pie
                  data={{
                    labels: ["Principal", "Extra Pay"],
                    datasets: [
                      {
                        label: "Breakup",
                        data: [principalExtra.principal, principalExtra.extra],
                        backgroundColor: ["#93c5fd", "#fbcfe8"],
                        borderWidth: 1,
                      },
                    ],
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Charts */}
        <MonthlyPaymentsChart />

        {/* Bar Charts */}
        <MonthlyRemaingDebtChart />
      </div>

      {/* Line Charts */}
      <MonthlyTotalDebtLineChart />
    </div>
  );
}
