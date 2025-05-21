"use client";

import { usePathname } from "next/navigation";
import {ThemeSwitcher} from "@/components/theme-switcher";
import { Footer } from "@/components/footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isUserPath = pathname.startsWith("/user");

  return (
    <>
      {!isUserPath && <ThemeSwitcher />}
      <main>{children}</main>
      {!isUserPath && <Footer />}
    </>
  );
}
