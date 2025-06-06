"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { addMonths, endOfMonth, format } from "date-fns";

type Payable = {
  title: string;
  extra_pay: number;
  interest_per_month: number;
  remaining_amount: number;
  emi_amount: number;
  payee: string;
  end_date: string; // ISO format
  total_amount: string;
};

export default function Insights() {
  const supabase = createClient();
  const [payables, setPayables] = useState<Payable[]>([]);

  useEffect(() => {
    const fetchPayables = async () => {
      const { data, error } = await supabase
        .from("monthly_payables")
        .select(
          "title, extra_pay, interest_per_month, remaining_amount, emi_amount, payee, end_date, total_amount"
        )
        .eq("is_closed", false);

      if (error) {
        console.error("Error fetching payables:", error);
        return;
      }

      setPayables(data || []);
    };

    fetchPayables();
  }, []);

  const topExtraPayables = [...payables]
    .filter((p) => p.extra_pay > 0)
    .sort((a, b) => b.extra_pay - a.extra_pay)
    .slice(0, 10);

  const topInterestPayables = [...payables]
    .filter((p) => p.interest_per_month > 0)
    .sort((a, b) => b.interest_per_month - a.interest_per_month)
    .slice(0, 10);

  const topEmiPayables = [...payables]
    .filter((p) => p.emi_amount > 0)
    .sort((a, b) => b.emi_amount - a.emi_amount)
    .slice(0, 10);

  const strategicClosures = [...payables]
    .filter((p) => p.emi_amount > 0 && p.remaining_amount > 0)
    .sort((a, b) => {
      const aRatio = a.emi_amount / a.remaining_amount;
      const bRatio = b.emi_amount / b.remaining_amount;
      return bRatio - aRatio; // higher ratio = better impact
    })
    .slice(0, 10);
  const totalStrategicRemaining = strategicClosures.reduce(
    (sum, p) => sum + p.remaining_amount,
    0
  );
  const totalStrategicEmi = strategicClosures.reduce(
    (sum, p) => sum + p.emi_amount,
    0
  );

  const now = new Date();
  const threeMonthsFromNow = endOfMonth(addMonths(now, 3));
  
  const closingSoon = payables
    .filter((p) => {
      if (!p.end_date) return false;
      const end = new Date(p.end_date);
      return end >= now && end <= threeMonthsFromNow;
    })
    .sort(
      (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
    );
  

  const totalExtra = topExtraPayables.reduce((sum, p) => sum + p.extra_pay, 0);

  return (
    <div className="space-y-6 p-4">
      {/* Row 3: Full-width Card for Payables Closing Soon */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base md:text-lg">
              Strategic Insight: Payables Closing in Next 3 Months
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              These payables are nearing completion — prioritizing them helps
              reduce active liabilities and frees up EMI obligations sooner.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {closingSoon.length > 0 ? (
            closingSoon.map((p, idx) => (
              <div key={idx} className="border-b pb-3">
                <div className="font-medium mb-1">
                  {idx + 1}. {p.title}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-4">
                  <div className="flex justify-between md:justify-normal gap-2 items-center">
                    <span className="font-semibold">Payee:</span>
                    <span>{p.payee}</span>
                  </div>
                  <div className="flex justify-between md:justify-normal gap-2 items-center">
                    <span className="font-semibold">EMI:</span>
                    <span>₹{p.emi_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between md:justify-normal gap-2 items-center">
                    <span className="font-semibold">Remaining:</span>
                    <span>₹{p.remaining_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between md:justify-normal gap-2 items-center">
                    <span className="font-semibold">Total:</span>
                    <span>₹{p.total_amount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex md:justify-normal gap-2 items-center font-medium">
                  <span className="">Ends On:</span>
                  <span className="text-green-700">{format(new Date(p.end_date), "dd-MMM-yyyy")}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              No payables closing within the next 3 months.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 1: Extra + Interest Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Extra Paying Payables */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base md:text-lg">
                Strategic Insight: High Extra Payments
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                These payables have high extra payments — amounts not reducing
                the principal. Minimizing them can improve repayment efficiency
                and save on wasteful expenses.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {topExtraPayables.length > 0 ? (
              topExtraPayables.map((p, idx) => (
                <div key={idx} className="flex justify-between border-b pb-1">
                  <div>
                    <div className="font-medium">
                      {idx + 1}. {p.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Remaining: ₹{p.remaining_amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-green-600">
                    +₹{p.extra_pay.toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No extra payments found.
              </div>
            )}
          </CardContent>
          {topExtraPayables.length > 0 && (
            <CardFooter className="text-right font-semibold text-green-700">
              Total Extra Paying: ₹{totalExtra.toLocaleString()}
            </CardFooter>
          )}
        </Card>

        {/* Card 2: Highest Interest Payables */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base md:text-lg">
                Strategic Insight: Highest Interest Payables
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                These payables incur the most interest annually — prioritize
                these to reduce overall borrowing costs significantly.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {topInterestPayables.length > 0 ? (
              topInterestPayables.map((p, idx) => (
                <div key={idx} className="flex justify-between border-b pb-1">
                  <div>
                    <div className="font-medium">
                      {idx + 1}. {p.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Remaining: ₹{p.remaining_amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-red-600">
                    {(p.interest_per_month * 12).toFixed(2)}%/yr
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No high interest payables found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: EMI Based Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 3: Highest EMI Payables */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base md:text-lg">
                Strategic Insight: Highest Monthly EMI Payables
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                These payables demand the highest monthly cash outflows —
                reviewing them helps in managing liquidity and planning
                pre-closures.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {topEmiPayables.length > 0 ? (
              topEmiPayables.map((p, idx) => (
                <div key={idx} className="flex justify-between border-b pb-1">
                  <div>
                    <div className="font-medium">
                      {idx + 1}. {p.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Remaining: ₹{p.remaining_amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-green-700">
                    ₹{p.emi_amount.toLocaleString()}/mo
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No EMI payables found.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base md:text-lg">
                Strategic Closures: Low Remaining, High EMI
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                These payables have the lowest remaining balances but the
                highest EMIs — closing them will free up significant monthly
                cash flow quickly.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {strategicClosures.length > 0 ? (
              strategicClosures.map((p, idx) => (
                <div key={idx} className="flex justify-between border-b pb-1">
                  <div>
                    <div className="font-medium">
                      {idx + 1}. {p.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Remaining: ₹{p.remaining_amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-emerald-700">
                    ₹{p.emi_amount.toLocaleString()}/mo
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No impactful closures found.
              </div>
            )}
          </CardContent>
          {strategicClosures.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground font-medium pt-2">
              <p>
                Clear remaining dues of{" "}
                <span className="text-black font-semibold px-1">
                  ₹{totalStrategicRemaining.toLocaleString()}
                </span>
                to free up{" "}
                <span className="text-green-700 font-semibold px-1">
                  ₹{totalStrategicEmi.toLocaleString()}
                </span>{" "}
                in monthly EMI cash flow.
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}