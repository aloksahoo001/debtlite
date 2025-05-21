'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between px-4 md:py-10 py-20 bg-background text-foreground">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl md:text-3xl font-bold tracking-tight sm:text-5xl">
          Welcome to <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent font-semibold">
      DebtLite
    </span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Track your EMIs, bills, and credit card payments. Get smart reminders and stay financially healthy.
        </p>
        <Link href="/sign-in">
          <Button size="lg" className="mt-5">Get Started</Button>
        </Link>
      </div>

      <div className="mt-10 w-full max-w-md grid gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="font-semibold">📅 Smart Reminders</p>
            <p className="text-sm text-muted-foreground">Never miss an EMI or bill due date again.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="font-semibold">📊 Debt Tracking</p>
            <p className="text-sm text-muted-foreground">See your remaining balance and progress over time.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="font-semibold">🔐 Secure Access</p>
            <p className="text-sm text-muted-foreground">Your financial data is safe, encrypted, and never shared.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}