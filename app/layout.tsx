
import "./globals.css";
import type { ReactNode } from "react";

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
      <body>{children}</body>
    </html>
  );
}
