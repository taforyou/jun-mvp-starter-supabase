import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jun MVP Starter • migrated by taforyou",
  description:
    "Go production in minutes with Next.js, Line Login, and Supabase",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://jun-mvp-starter-supabase.pages.dev"
  ),
  openGraph: {
    type: "website",
    title: "Jun MVP Starter • migrated by taforyou",
    description:
      "Go production in minutes with Next.js, Line Login, and Supabase",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Jun MVP Starter • migrated by taforyou - Go production in minutes",
      },
    ],
    siteName: "Jun MVP Starter • migrated by taforyou",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jun MVP Starter • migrated by taforyou",
    description:
      "Go production in minutes with Next.js, Line Login, and Supabase",
    images: ["/banner.png"],
    creator: "@siriwatknp",
  },
  other: {
    "line:card": "summary_large_image",
    "line:title": "Jun MVP Starter • migrated by taforyou",
    "line:description":
      "Go production in minutes with Next.js, Line Login, and Supabase",
    "line:image": "/banner.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense>
          <AuthProvider>{children}</AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
