'use client';

import { useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export function FormMessage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (success) toast.success("Success", { description: success });
    else if (error) toast.error("Error", { description: error });
    else if (message) toast("Notice", { description: message });
  }, [searchParams]);

  return null;
}