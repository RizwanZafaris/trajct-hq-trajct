import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trajct — AI Hiring & Career Acceleration",
  description: "AI-powered hiring and career acceleration platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
