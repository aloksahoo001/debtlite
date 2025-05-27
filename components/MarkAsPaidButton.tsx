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

type Payable = {
  id: string;
  emi_amount: number;
  remaining_amount: number;
  type: string;
  // add other fields if needed
};

export function MarkAsPaidButton({
  payable,
  onPaymentSuccess,
}: {
  payable: Payable;
  onPaymentSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState(payable.emi_amount);
  const [remainingAmount, setRemainingAmount] = useState(
    payable.type == 'emi'?payable.remaining_amount-payable.emi_amount:payable.remaining_amount
  );
  const supabase = createClient();

  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  const markAsPaid = async (
    payableId: string,
    amountPaid: number,
    remainingAmount: number
  ): Promise<{ error: any }> => {
    const userId = user?.id;
  
    if (!userId) {
      return { error: new Error("User not found") };
    }
  
    // Insert into payments
    const { error: insertError } = await supabase.from("payments").insert({
      monthly_payable_id: payableId,
      user_id: userId,
      amount_paid: amountPaid,
      payment_date: new Date().toISOString(),
      remaining_amount: remainingAmount,
    });
  
    if (insertError) return { error: insertError };
  
    // Update monthly_payables
    const { error: updateError } = await supabase
      .from("monthly_payables")
      .update({
        emi_amount: amountPaid,
        remaining_amount: remainingAmount,
      })
      .eq("id", payableId);
  
    return { error: updateError };
  };
  

  const handleSubmit = async () => {
    const { error } = await markAsPaid(
      payable.id,
      Number(amountPaid),
      Number(remainingAmount)
    );
    if (!error) 
    {
      onPaymentSuccess();
      setOpen(false);
    }
    else console.error("Payment Error:", error.message);
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
          <DialogTitle>Confirm Payment</DialogTitle>
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
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
