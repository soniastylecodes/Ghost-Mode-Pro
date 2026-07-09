import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ghost Mode — Execute in silence",
  description:
    "Ghost Mode is a ruthless execution engine. One goal. Three missions a day. No excuses. Proof required.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sora.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-void text-bone min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
