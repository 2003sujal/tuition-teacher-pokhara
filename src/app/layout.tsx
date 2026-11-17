import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Tuition Teacher Pokhara", template: "%s · Tuition Teacher Pokhara" },
  description: "Register as a tutor with Tuition Teacher Pokhara — a trusted tuition agency in Pokhara, Nepal.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#20467a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster position="top-center" richColors closeButton toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
