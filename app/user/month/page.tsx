"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { format, isSameMonth } from "date-fns";
import { toast } from "sonner";
import { CheckCircle, Landmark, User, Wallet } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatINR } from "@/utils/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function ThisMonthPayablesComponent() {
  const supabase = createClient();
  const [payables, setPayables] = useState<Payable[]>([]);
  const [payments, setPayments] = useState<
    { monthly_payable_id: string; payment_date: string }[]
  >([]);
  const [filterPayee, setFilterPayee] = useState<string>("all");
  const [uniquePayees, setUniquePayees] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  useEffect(() => {
    fetchData();
  }, []);

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

    const currentMonth = new Date();
    const filteredPayments = (paymentsData || []).filter((p) =>
      isSameMonth(new Date(p.payment_date), currentMonth)
    );

    setPayables(payableData || []);
    setPayments(filteredPayments);
    const payees = Array.from(new Set((payableData || []).map((p) => p.payee)));
    setUniquePayees(payees);
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

  const markAsPaid = async (payableId: string, amountPaid: Number) => {
    const { error } = await supabase.from("payments").insert({
      monthly_payable_id: payableId,
      user_id: user.id,
      amount_paid: amountPaid,
      payment_date: new Date().toISOString(),
    });

    if (error) {
      toast.error("Failed to mark as paid.");
    } else {
      toast.success("Marked as paid.");
      fetchData();
    }
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

  const total_debt = allPayables.reduce((sum, p) => {
    return p.type !== "bill" && p.type !== "rent" && p.type !== "loan"
      ? sum + (p.remaining_amount || 0)
      : sum;
  }, 0);

  const total_bills = allPayables.reduce((sum, p) => {
    return p.type == "bill" ? sum + (p.emi_amount || 0) : sum;
  }, 0);

  const getDueDate = (emi_day: number) => {
    const today = new Date();
    const day = today.getDate();
    const year = today.getFullYear();
    const month = today.getMonth();
    const dueMonth = day <= emi_day ? month : month;
    return format(
      new Date(year, dueMonth, emi_day),
      "'Day - 'do 'of' MMMM, eeee"
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="w-64">
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
        <div className="font-semibold">{format(new Date(), "MMM-yyyy")}</div>
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
                <strong>Total Payable:</strong> {formatINR(total_payable)}
              </div>
              <div>
                <strong>Yet to Pay:</strong> {formatINR(total_yet_to_pay)}
              </div>
              <div>
                <strong>Total Bills:</strong> {formatINR(total_bills)}
              </div>
              <div>
                <strong>Total Debt:</strong> {formatINR(total_debt)}
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
                        {isPaid(p.id) ? (
                          <div className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded text-sm">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Paid
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => markAsPaid(p.id, p.emi_amount)}
                          >
                            Mark As Paid
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 pb-2 md:gap-36">
                        <div className="flex items-center justify-between md:justify-start gap-2">
                          <div className="flex items-center gap-2 font-semibold">
                            <Wallet className="w-4 h-4 text-foreground" />
                            Pay Type:
                          </div>
                          <div className="items-center">
                            {p.pay_type == "auto_debit"
                              ? "Auto Debit"
                              : "Manual"}
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