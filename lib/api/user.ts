'use server';

import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function resetPassword(password: string, confirmPassword: string) {
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