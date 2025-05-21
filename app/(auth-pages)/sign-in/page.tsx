"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signInUser } from "@/lib/api/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/useAuthStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await signInUser(email, password);

      if (!result.success) {
        toast.error("Login Failed", { description: result.message });
      } else {
        useAuthStore.getState().setUser(result.user);
        toast.success("Signed in successfully");
        router.push("/user/dashboard");
      }
    });
  };

  return (
    <div className="bg-background text-foreground grid place-items-center px-4 my-36 md:my-24">
      <Card className="w-full max-w-lg shadow-lg rounded-xl">
      <CardHeader className="text-center">
  <CardTitle className="text-2xl">
    Sign in to{" "}
    <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent font-semibold">
      DebtLite
    </span>
  </CardTitle>
</CardHeader>


        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-5">
            {/* Email Field */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs underline text-muted-foreground"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Signing In..." : "Sign in"}
            </Button>

            {/* Sign up link */}
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="underline text-primary font-medium"
              >
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
