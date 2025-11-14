import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Habit & Health Tracker",
  description: "Track your meals, workouts, and habits with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
