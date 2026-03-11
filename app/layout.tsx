import type { Metadata } from "next";
import { Geist, Geist_Mono, Patrick_Hand } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const patrick = Patrick_Hand({
  weight: "400",
  variable: "--font-patrick",
  subsets: ["latin"],
});

import Sidebar from "./components/layout/Sidebar";
import TopNav from "./components/layout/TopNav";
import GlobalShortcuts from "./components/layout/GlobalShortcuts";

export const metadata: Metadata = {
  title: "Exam Survival AI Platform",
  description: "Generate structured study plans and ace your exams with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${patrick.variable} antialiased overflow-hidden print:overflow-visible print:h-auto print:block`}
      >
        <GlobalShortcuts />
        <div className="flex h-screen print:h-auto print:block print:overflow-visible bg-slate-950 text-slate-100">
          <Sidebar />
          <div className="flex-1 flex flex-col relative overflow-hidden min-w-0 print:block print:overflow-visible print:h-auto">
            <TopNav />
            <main className="flex-1 overflow-y-auto print:overflow-visible print:h-auto print:block custom-scrollbar relative">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
