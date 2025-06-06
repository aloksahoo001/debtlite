"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import type { Payable } from "@/types/supabase";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  Landmark,
  User,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatINR } from "@/utils/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkAsPaidButton } from "@/components/MarkAsPaidButton";
import { PayableChartDialog } from "@/components/PayableChartDialog";

export default function ThisMonthPayablesComponent() {
  const supabase = createClient();
  const [payables, setPayables] = useState<Payable[]>([]);
  const [payments, setPayments] = useState<
    { monthly_payable_id: string; payment_date: string }[]
  >([]);
  const [filterPayee, setFilterPayee] = useState<string>("all");
  const [uniquePayees, setUniquePayees] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    const { data: payableData, error: payablesError } = await supabase
      .from("monthly_payables")
      .select("*");

    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("monthly_payable_id, payment_date");

    if (payablesError || paymentsError) {
      toast.error("Error fetching data.");
      setLoading(false);
      return;
    }

    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    // Extract available months from payments
    const monthSet = new Set<string>();
    (paymentsData || []).forEach((p) => {
      const date = new Date(p.payment_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      monthSet.add(`${year}-${month}`);
    });

    // Ensure current month is always included
    monthSet.add(currentMonthStr);

    const sortedMonths = Array.from(monthSet).sort().reverse(); // latest first
    setAvailableMonths(sortedMonths);

    const [year, month] = selectedMonth.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const filteredPayments = (paymentsData || []).filter((p) => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
    });

    setPayables(payableData || []);
    setPayments(filteredPayments);
    const payees = Array.from(new Set((payableData || []).map((p) => p.payee)));
    setUniquePayees(payees.sort());
    setLoading(false);
  };

  const groupByEmiDay = (list: Payable[]) => {
    const grouped: { [emi_day: number]: Payable[] } = {};
    list.forEach((item) => {
      if (!grouped[item.emi_day]) grouped[item.emi_day] = [];
      grouped[item.emi_day].push(item);
    });
    return grouped;
  };

  const isPaid = (payableId: string) => {
    return payments.some((p) => p.monthly_payable_id === payableId);
  };

  const currentMonthPayables = payables.filter((p) => {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), p.emi_day);
    return dueDate >= new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const filtered =
    filterPayee === "all"
      ? currentMonthPayables
      : currentMonthPayables.filter((p) => p.payee === filterPayee);

  const grouped = groupByEmiDay(filtered);
  const sortedEmiDays = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  const allPayables = sortedEmiDays.flatMap((day) => grouped[day]);

  const total_payable = allPayables.reduce((sum, p) => sum + p.emi_amount, 0);

  const total_paid = allPayables.reduce((sum, p) => {
    const paid = payments.some(
      (payment) => payment.monthly_payable_id === p.id
    );
    return paid ? sum + p.emi_amount : sum;
  }, 0);

  const total_yet_to_pay = total_payable - total_paid;

  /*const total_debt = allPayables.reduce((sum, p) => {
    return p.type !== "bill" && p.type !== "rent" && p.type !== "loan"
      ? sum + (p.remaining_amount || 0)
      : sum;
  }, 0);*/

  const total_bills = allPayables.reduce((sum, p) => {
    return p.type == "bill" ? sum + (p.emi_amount || 0) : sum;
  }, 0);

  const total_not_paid_count = allPayables.filter(
    (p) => !payments.some((payment) => payment.monthly_payable_id === p.id)
  ).length;

  const getDueDate = (emi_day: number) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return format(
      new Date(year, month - 1, emi_day),
      "'Day - 'do 'of' MMMM, eeee"
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="w-48 md:w-48">
          <Select onValueChange={setFilterPayee} defaultValue={filterPayee}>
            <SelectTrigger>
              <SelectValue placeholder="Select Payee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {uniquePayees.map((payee) => (
                <SelectItem key={payee} value={payee}>
                  {payee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44 md:w-48">
          <Select
            onValueChange={(value) => setSelectedMonth(value)}
            value={selectedMonth}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((monthStr) => {
                const [year, month] = monthStr.split("-");
                const label = format(
                  new Date(Number(year), Number(month) - 1),
                  "MMMM yyyy"
                );
                return (
                  <SelectItem key={monthStr} value={monthStr}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </CardContent>
          </Card>
          {[1, 2].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    {j !== 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-32" />
              </CardFooter>
            </Card>
          ))}
        </>
      ) : (
        <>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Total Paid:</strong> {formatINR(total_paid)}
              </div>
              <div>
                <strong>No. of Payments Left:</strong> {total_not_paid_count}
              </div>
              <div>
                <strong>Amount to Pay:</strong> {formatINR(total_yet_to_pay)}
              </div>
              <div>
                <strong>Total Bills:</strong> {formatINR(total_bills)}
              </div>
            </CardContent>
          </Card>
          {sortedEmiDays.map((emiDay) => {
            const payablesForDay = grouped[emiDay];
            const totalEmi = payablesForDay.reduce(
              (sum, p) => sum + p.emi_amount,
              0
            );
            return (
              <Card key={emiDay}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    {getDueDate(emiDay)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payablesForDay.map((p, i) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium">
                          {i + 1}. {p.title} — ₹{p.emi_amount}
                        </div>
                        <div className="flex items-center gap-2">
                          <PayableChartDialog
                            monthlyPayableId={p.id}
                            payableTitle={p.title}
                          />
                          {isPaid(p.id) ? (
                            <div className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-md text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Paid
                            </div>
                          ) : (
                            <MarkAsPaidButton
                              payable={p}
                              selectedMonth={selectedMonth}
                              onPaymentSuccess={fetchData}
                            />
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-5 pb-2">
                        <div className="flex items-center justify-between md:justify-start gap-2">
                          <div className="flex items-center gap-2 font-semibold">
                            <Wallet className="w-4 h-4 text-foreground" />
                            Pay Type:
                          </div>
                          <div className="items-center">
                            {p.pay_type == "auto_debit" ? "Auto" : "Manual"}
                          </div>
                        </div>
                        <div className="flex justify-between md:justify-start gap-2 items-center">
                          <div className="flex items-center gap-2 font-semibold">
                            <Landmark className="w-4 h-4 text-foreground" />
                            Bank:
                          </div>
                          <div className="items-center">{p.payment_bank}</div>
                        </div>
                        <div className="flex justify-between md:justify-start items-center gap-2">
                          <div className="flex items-center gap-2 font-semibold">
                            <User className="w-4 h-4 text-foreground" />
                            Payee:
                          </div>
                          <div className="items-center">{p.payee}</div>
                        </div>
                        <div className="flex justify-between md:justify-start items-center gap-2">
                          <div className="flex items-center gap-2 font-semibold">
                            <Clock className="w-4 h-4 text-foreground" />
                            Remaining:
                          </div>
                          <div className="items-center">
                            {formatINR(p.remaining_amount)}
                          </div>
                        </div>
                        <div className="flex justify-between md:justify-start items-center gap-2">
                          <div className="flex items-center gap-2 font-semibold">
                            <CalendarCheck className="w-4 h-4 text-foreground" />
                            Last Date:
                          </div>
                          <div className="items-center">
                            {format(p.end_date, "dd-MMM-yy")}
                          </div>
                        </div>
                      </div>
                      {i !== payablesForDay.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="text-sm font-semibold">
                  Total EMI: {formatINR(totalEmi)}
                </CardFooter>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
