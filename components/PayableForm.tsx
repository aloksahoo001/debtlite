// PayableForm.tsx — with strict PayableInput typing and scrollable, responsive layout + select fields

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PayableInput } from "@/app/user/payables/page";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/useAuthStore";

interface Props {
  initialData?: PayableInput;
  onSubmit: (data: PayableInput) => void;
  onCancel: () => void;
}

export default function PayableForm({
  initialData,
  onSubmit,
  onCancel,
}: Props) {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return null;
  }
  const [form, setForm] = useState<PayableInput>(
    initialData || {
      user_id: user.id,
      title: "",
      type: "",
      total_amount: 0,
      remaining_amount: 0,
      start_date: new Date().toISOString().substring(0, 10),
      end_date: new Date().toISOString().substring(0, 10),
      emi_amount: 0,
      emi_day: 1,
      status: "active",
      is_closed: false,
      payment_bank: "",
      pay_type: "",
      payee: "",
      interest_per_month: 0,
      extra_pay: 0,
    }
  );

  const handleChange = (field: keyof PayableInput, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.type.trim())
      return alert("Title and type are required");
    if (form.total_amount <= 0 || form.emi_amount <= 0)
      return alert("Amount values must be positive");
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="pb-4">
          {initialData ? "Edit Payable" : "Create Payable"}
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="flex-1 overflow-y-auto px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2">
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(val) => handleChange("type", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { label: "Loan On Interest", value: "loan" },
                  { label: "Credit Card", value: "credit_card" },
                  { label: "EMI", value: "emi" },
                  { label: "Bill", value: "bill" },
                  { label: "Rent", value: "rent" },
                  { label: "Pay Later", value: "pay_later" },
                ].map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Total Amount</Label>
            <Input
              type="text"
              value={form.total_amount}
              onChange={(e) =>
                handleChange("total_amount", Number(e.target.value))
              }
              required
            />
          </div>
          <div>
            <Label>Remaining Amount</Label>
            <Input
              type="text"
              value={form.remaining_amount}
              onChange={(e) =>
                handleChange("remaining_amount", Number(e.target.value))
              }
              required
            />
          </div>
          <div>
            <Label>EMI Amount</Label>
            <Input
              type="text"
              value={form.emi_amount}
              onChange={(e) =>
                handleChange("emi_amount", Number(e.target.value))
              }
              required
            />
          </div>
          <div>
            <Label>EMI Day</Label>
            <Input
              type="number"
              value={form.emi_day}
              min={1}
              max={31}
              onChange={(e) => handleChange("emi_day", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => handleChange("start_date", e.target.value)}
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => handleChange("end_date", e.target.value)}
            />
          </div>
          <div>
            <Label>Bank</Label>
            <Select
              value={form.payment_bank}
              onValueChange={(val) => handleChange("payment_bank", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Bank" />
              </SelectTrigger>
              <SelectContent>
                {["AXIS", "HDFC", "KBL", "Manual", "SBI", "SCB", "UNION"]
                  .sort()
                  .map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payee</Label>
            <Select
              value={form.payee}
              onValueChange={(val) => handleChange("payee", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Payee" />
              </SelectTrigger>
              <SelectContent>
                {["Alok", "Sweta"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pay Type</Label>
            <Select
              value={form.pay_type}
              onValueChange={(val) => handleChange("pay_type", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Pay Type" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { label: "Auto Debit", value: "auto_debit" },
                  { label: "Manual", value: "manual" },
                ].map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Interest / Month (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.interest_per_month}
              onChange={(e) =>
                handleChange("interest_per_month", parseFloat(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Extra Pay</Label>
            <Input
              type="number"
              value={form.extra_pay}
              onChange={(e) =>
                handleChange("extra_pay", parseFloat(e.target.value))
              }
            />
          </div>
        </div>
      </ScrollArea>

      <DialogFooter className="pt-4 gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialData ? "Update" : "Create"}</Button>
      </DialogFooter>
    </form>
  );
}
