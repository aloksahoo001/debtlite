'use client';

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signUpUser } from "@/lib/api/auth"; // centralized logic
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmtpMessage } from "../smtp-message";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await signUpUser(email, password);

      if (!result.success) {
        toast.error("Signup failed", { description: result.message });
      } else {
        toast.success("Account created!", {
          description: result.message,
        });
        // optionally route after success
        // router.push("/sign-in");
      }
    });
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 mt-32">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Sign up to <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent font-semibold">
      DebtLite
    </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Signing up..." : "Sign up"}
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