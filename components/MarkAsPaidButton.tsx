import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { Loader2 } from "lucide-react";

type Payable = {
  id: string;
  title: string;
  emi_amount: number;
  remaining_amount: number;
  extra_pay: number;
  type: string;
  // add other fields if needed
};

export function MarkAsPaidButton({
  payable,
  onPaymentSuccess,
  selectedMonth,
}: {
  payable: Payable;
  onPaymentSuccess: () => void;
  selectedMonth: string;
}) {
  const [open, setOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState(payable.emi_amount);
  const [title, setTitle] = useState(payable.title);
  const [remainingAmount, setRemainingAmount] = useState(
    payable.type == "emi"
      ? payable.remaining_amount - payable.emi_amount
      : payable.remaining_amount
  );
  const [extraAmount, setExtraAmount] = useState(payable.extra_pay);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  const markAsPaid = async (
    payableId: string,
    amountPaid: number,
    remainingAmount: number,
    extraAmount: number
  ): Promise<{ error: any }> => {
    const userId = user?.id;

    if (!userId) return { error: new Error("User not found") };

    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const [selYear, selMonth] = selectedMonth.split("-").map(Number);
    const paymentDate =
      selectedMonth === currentMonthStr
        ? today
        : new Date(selYear, selMonth, 0); // last day of selected month

    // Insert into payments
    const { error: insertError } = await supabase.from("payments").insert({
      monthly_payable_id: payableId,
      user_id: userId,
      amount_paid: amountPaid,
      payment_date: paymentDate.toISOString(),
      remaining_amount: remainingAmount,
      extra_amount: extraAmount,
    });

    if (insertError) return { error: insertError };

    // Update monthly_payables
    const { error: updateError } = await supabase
      .from("monthly_payables")
      .update({
        emi_amount: amountPaid,
        remaining_amount: remainingAmount,
        extra_pay: extraAmount,
      })
      .eq("id", payableId);

    return { error: updateError };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const { error } = await markAsPaid(
      payable.id,
      Number(amountPaid),
      Number(remainingAmount),
      Number(extraAmount)
    );
    if (!error) {
      onPaymentSuccess();
      setIsSubmitting(false);
      setOpen(false);
    } else console.error("Payment Error:", error.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs h-7">
          Mark As Paid
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Confirm Payment{" "}
            <span className="text-muted-foreground">[{title}]</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Amount Paid</label>
            <Input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Remaining Amount</label>
            <Input
              type="number"
              value={remainingAmount}
              onChange={(e) => setRemainingAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Extra Amount</label>
            <Input
              type="number"
              value={extraAmount}
              onChange={(e) => setExtraAmount(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
