'use client';

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { forgotPassword } from "@/lib/api/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmtpMessage } from "../smtp-message";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await forgotPassword(email);

      if (!result.success) {
        toast.error("Reset failed", { description: result.message });
      } else {
        toast.success("Check your email", {
          description: result.message,
        });
      }
    });
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 mt-32">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Reset Password"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="underline text-primary font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      <div className="mt-4">
        <SmtpMessage />
      </div>
    </div>
  );
}