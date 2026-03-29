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

import GlobalShortcuts from "./components/layout/GlobalShortcuts";
import LayoutShell from "./components/layout/LayoutShell";
import { createClient } from "@/utils/supabase/server";
import Providers from "./providers/Providers";

export const metadata: Metadata = {
  title: "Exam Survival AI Platform",
  description: "Generate structured study plans and ace your exams with AI.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    // If auth fails on Vercel (missing env, cold start), gracefully degrade to logged-out state
    console.error('[RootLayout] auth.getUser failed, degrading to guest:', err);
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${patrick.variable} antialiased overflow-hidden print:overflow-visible print:h-auto print:block`}
      >
        <GlobalShortcuts />
        <Providers>
          <LayoutShell user={user}>
            {children}
          </LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
