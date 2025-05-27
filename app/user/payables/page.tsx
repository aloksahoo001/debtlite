"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import PayableForm from "@/components/PayableForm";
import { createClient } from "@/utils/supabase/client";
import type { Payable } from "@/types/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarDays,
  Wallet,
  Banknote,
  CheckCircle,
  XCircle,
  FileEdit,
  PlusIcon,
} from "lucide-react";

const PAGE_SIZE = 50;

export type PayableInput = Omit<Payable, "id" | "created_at">;

export default function PayablesComponent() {
  const supabase = createClient();
  const [payables, setPayables] = useState<Payable[]>([]);
  const [filter, setFilter] = useState("all");
  const [sortKey, setSortKey] = useState("emi_day");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Payable | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uniquePayees, setUniquePayees] = useState<string[]>([]);

  async function fetchPayables(reset = false, dataPage = 1) {
    setLoading(true);
    console.log("page=" + dataPage);
    const from = reset ? 0 : (dataPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("monthly_payables")
      .select("*")
      .order(sortKey, { ascending: true })
      .range(from, to);

    if (error) {
      console.error(error);
      toast.error("Failed to fetch payables.");
    } else {
      if (reset) setPayables(data as Payable[]);
      else setPayables((prev) => [...prev, ...(data as Payable[])]);
      setHasMore((data?.length || 0) === PAGE_SIZE);
    }
    const payees = Array.from(new Set((data || []).map((p) => p.payee)));
    setUniquePayees(payees.sort());
    setPage(dataPage);
    setLoading(false);
  }

  useEffect(() => {
    fetchPayables(true);
  }, [filter, sortKey]);

  const handleSave = async (payload: PayableInput) => {
    let result;
    if (editing?.id) {
      result = await supabase
        .from("monthly_payables")
        .update(payload)
        .eq("id", editing.id);
      if (!result.error) toast.success("Payable updated successfully.");
    } else {
      result = await supabase.from("monthly_payables").insert(payload);
      if (!result.error) toast.success("Payable created successfully.");
    }

    if (!result.error) {
      setDialogOpen(false);
      setEditing(null);
      fetchPayables(true);
    } else {
      toast.error(result.error.message);
    }
  };

  const handleClose = async (id: string) => {
    const { error } = await supabase
      .from("monthly_payables")
      .update({
        is_closed: true,
        status: "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to close payable.");
    } else {
      toast.success("Payable closed.");
      fetchPayables(true);
    }
  };

  const filteredData = payables.filter(
    (p) => filter === "all" || p.payee === filter
  );

  const getDueDate = (emi_day: number) => {
    const today = new Date();
    const day = today.getDate();
    const year = today.getFullYear();
    const month = today.getMonth();
    const dueMonth = day <= emi_day ? month : month + 1;
    return format(new Date(year, dueMonth, emi_day), "dd-MMM-yy");
  };

  function SkeletonCard() {
    return (
      <Card className="animate-pulse">
        <CardHeader className="p-4">
          <div className="h-4 w-1/2 bg-muted rounded mb-2" />
          <div className="h-3 w-24 bg-muted rounded" />
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-5/6 bg-muted rounded" />
          <div className="h-3 w-4/6 bg-muted rounded" />
        </CardContent>
        <CardFooter className="p-4 flex justify-between">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-12 bg-muted rounded" />
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select onValueChange={setFilter} defaultValue={filter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
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

          <Select onValueChange={setSortKey} defaultValue={sortKey}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emi_day">Due Date</SelectItem>
              <SelectItem value="remaining_amount">Remaining Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Add Payable
            </Button>
          </DialogTrigger>
          <DialogContent>
            <PayableForm
              {...(editing ? { initialData: editing } : {})}
              onSubmit={handleSave}
              onCancel={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : filteredData.map((p, index) => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-start justify-between p-4">
                  <CardTitle className="text-base font-medium">
                    {index + 1}. {p.title} ({getDueDate(p.emi_day)})
                  </CardTitle>
                  <span
                    className={`text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 ${
                      p.is_closed
                        ? "bg-rose-100 text-rose-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {p.is_closed ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    {p.is_closed ? "Closed" : "Active"}
                  </span>
                </CardHeader>

                <CardContent className="hidden md:block lg:block sm:block text-sm text-muted-foreground p-4 py-0">
                  <div className="flex grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>
                        <strong>Next Due Date:</strong> {getDueDate(p.emi_day)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      <span>
                        <strong>Pay Type:</strong>{" "}
                        {p.pay_type == "auto_debit" ? "Auto Debit" : "Manual"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      <span>
                        <strong>Total:</strong> ₹
                        {p.total_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      <span>
                        <strong>Remaining:</strong> ₹
                        {p.remaining_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="md:hidden ld:hidden sm:hidden text-sm text-muted-foreground p-4 py-0">
                  <div className="flex grid grid-cols-1 text-md font-medium">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Next Due Date
                      </div>
                      <div className="flex justify-end">
                        {getDueDate(p.emi_day)}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Pay Type
                      </div>
                      <div className="flex justify-end">
                        {p.pay_type == "auto_debit" ? "Auto Debit" : "Manual"}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        Total
                      </div>
                      <div className="flex justify-end">
                        ₹{p.total_amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        Remaining
                      </div>
                      <div className="flex justify-end">
                        ₹{p.remaining_amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between p-4">
                  <div className="text-sm font-bold">
                    <span className="text-muted-foreground">Payable:</span> ₹
                    {p.emi_amount}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setEditing(p);
                        setDialogOpen(true);
                      }}
                    >
                      <FileEdit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    {!p.is_closed && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleClose(p.id)}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => {
              fetchPayables(false, page + 1);
            }}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
