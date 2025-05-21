"use client";

export function Footer() {
  return (
    <footer className="w-full text-center text-xs text-muted-foreground py-6 border-t fixed bottom-0">
      © {new Date().getFullYear()} DebtLite. All rights reserved. Built with 💙
      in India.
    </footer>
  );
}
