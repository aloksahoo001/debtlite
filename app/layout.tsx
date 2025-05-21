import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import LayoutWrapper from "@/components/layout-wrapper";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export const metadata = {
  title: "DebtLite",
  description: "Track your debts, EMIs, and payments with ease.",
  icons: {
    icon: "/fav.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="bottom-right" richColors closeButton />
          <LayoutWrapper>{children}</LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
