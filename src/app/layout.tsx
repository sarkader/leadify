import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Setter App",
  description: "Pipeline, follow-ups, and scheduling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold tracking-tight">Leadify</Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/leads" className="btn btn-ghost px-3 py-1.5">Leads</Link>
              <Link href="/inbox" className="btn btn-ghost px-3 py-1.5">Inbox</Link>
              <Link href="/calendar" className="btn btn-ghost px-3 py-1.5">Calendar</Link>
              <Link href="/admin" className="btn btn-ghost px-3 py-1.5">Admin</Link>
            </nav>
            <div className="ml-auto">
              <form action="/api/logout" method="post">
                <button className="btn" type="submit">Logout</button>
              </form>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {children}
        </main>
      </body>
    </html>
  );
}
