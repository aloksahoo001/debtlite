"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isSameMonth } from "date-fns";
import { ChevronRight } from "lucide-react";

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
  const [upcoming, setUpcoming] = useState<{
    date: string;
    total: number;
    items: Payable[];
  } | null>(null);
  const [payStats, setPayStats] = useState({ paid: 0, unpaid: 0 });
  const [principalExtra, setPrincipalExtra] = useState({
    principal: 0,
    extra: 0,
  });
  const [typeBreakdown, setTypeBreakdown] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    const { data: payablesRaw } = await supabase
      .from("monthly_payables")
      .select("*");

    const { data: paymentsRaw } = await supabase
      .from("payments")
      .select("monthly_payable_id, payment_date");

    const payables = payablesRaw ?? [];
    const payments = paymentsRaw ?? [];

    const today = new Date();
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    // 1. Upcoming Payables
    const upcomingPayables = (payables ?? []).filter(
      (p) => p.emi_day > today.getDate()
    );
    if (upcomingPayables.length) {
      const groupedByDay: Record<number, Payable[]> = {};
      upcomingPayables.forEach((p) => {
        groupedByDay[p.emi_day] = [...(groupedByDay[p.emi_day] || []), p];
      });

      const nextEmiDay = Math.min(...Object.keys(groupedByDay).map(Number));
      const items = groupedByDay[nextEmiDay];
      const total = items.reduce((sum, p) => sum + p.emi_amount, 0);

      setUpcoming({
        date: format(
          new Date(today.getFullYear(), today.getMonth(), nextEmiDay),
          "MMM dd, yyyy"
        ),
        total,
        items,
      });
    }

    // 2. Paid / Unpaid This Month
    const thisMonthPayments = (payments ?? []).filter((p) =>
      isSameMonth(new Date(p.payment_date), today)
    );

    const paidSet = new Set(thisMonthPayments.map((p) => p.monthly_payable_id));

    let paid = 0;
    let unpaid = 0;
    (payables ?? []).forEach((p) => {
      const dueDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        p.emi_day
      );
      if (dueDate >= currentMonthStart) {
        if (paidSet.has(p.id)) paid += p.emi_amount;
        else unpaid += p.emi_amount;
      }
    });

    setPayStats({ paid, unpaid });

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
          rent: "Rent"
        };
    
        const type = typeLabels[p.type] || p.type;
        breakdown[type] = (breakdown[type] || 0) + p.emi_amount;
      }
    });
    setTypeBreakdown(breakdown);

    setLoading(false);
  }

  return (
    <div className="grid gap-4 p-4 md:p-6 max-w-screen-xl mx-auto">
      {/* Upcoming Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Payment</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-1/3 mt-2" />
            </>
          ) : upcoming ? (
            <>
              <p className="text-sm text-muted-foreground font-semibold mb-2">
                Due on {upcoming.date}
              </p>
              {upcoming.items.map((item, i) => (
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
              <div className="pt-3 flex justify-between items-center">
                <a
                  href="/user/month"
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </a>
                <div className="text-sm font-semibold">
                  Total: {formatINR(upcoming.total)}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No upcoming payments.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Paid / Unpaid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
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
          <Card key={idx}>
            <CardHeader>
              <CardTitle>
                {label} ({format(new Date(), "MMM-yyyy")})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className={`text-2xl font-semibold ${color}`}>
                  {formatINR(value)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
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
                          "#a5b4fc",
                          "#bbf7d0",
                          "#fde68a",
                          "#fca5a5",
                          "#fdba74",
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
    </div>
  );
}
