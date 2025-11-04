import type { Metadata } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import StoreProvider from "@/components/StoreProvider";

export const metadata: Metadata = {
  title: "Swipe AI Invoice Manager",
  description: "AI-powered invoice management system with automated data extraction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}