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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}>
        <header className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">Setter</Link>
            <nav className="flex items-center gap-4 text-sm text-slate-700">
              <Link href="/leads" className="hover:underline">Leads</Link>
              <Link href="/inbox" className="hover:underline">Inbox</Link>
              <Link href="/calendar" className="hover:underline">Calendar</Link>
            </nav>
            <div className="ml-auto text-sm">
              <form action="/api/logout" method="post"><button className="underline">Logout</button></form>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
