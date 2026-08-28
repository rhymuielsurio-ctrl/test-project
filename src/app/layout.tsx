import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/layout/app-nav";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "LeaveTrack",
  description: "Leave management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <AppNav>
          <Navbar />
        </AppNav>
        {children}
      </body>
    </html>
  );
}
