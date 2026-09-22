
import "./globals.css";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "FYTOBYTE",
  description: "Automated Quran video production",
};
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <body>{children}<Toaster /></body>
    </html>
  );
}
