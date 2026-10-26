import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nagdev Products - Plant Operations Portal & Factory ERP",
  description:
    "Castor Oil Manufacturing & Derivatives Facility Operations Portal conforming to IS 435 / BIS standards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
