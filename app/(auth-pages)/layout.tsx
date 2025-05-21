import { Toaster } from "@/components/ui/sonner";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children} <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
