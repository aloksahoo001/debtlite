'use server';

import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type AuthResponse =
  | { success: true; user: User; message?: string}
  | { success: false; message: string };

type AuthNoUserResponse =
  | { success: true; message: string}
  | { success: false; message: string };

export async function signUpUser(email: string, password: string): Promise<AuthNoUserResponse> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") || "";

  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "Thanks for signing up! Please check your email for a verification link.",
  };
}

export async function signInUser(email: string, password: string): Promise<AuthResponse> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "User not found after login." };

  const { data, error } = await supabase.auth.admin.updateUserById(
  'b980d3d6-7111-48dc-b3ec-b41978da3194', // UID
  {
    user_metadata: {
      display_name: 'Alok Sahoo'
    }
  }
)

  return {
    success: true,
    user: user,
  };
}

export async function forgotPassword(email: string): Promise<AuthNoUserResponse> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") || "";

  if (!email) {
    return { success: false, message: "Email is required" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    return { success: false, message: "Could not reset password" };
  }

  return {
    success: true,
    message: "Check your email for a link to reset your password.",
  };
}

export async function resetPassword(password: string, confirmPassword: string): Promise<AuthNoUserResponse> {
  const supabase = await createClient();

  if (!password || !confirmPassword) {
    return { success: false, message: "Password and confirm password are required" };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, message: "Password update failed" };
  }

  return { success: true, message: "Password updated" };
}

export async function signOutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
}