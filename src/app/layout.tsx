import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Image from "next/image";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Switched Devnet Faucet",
  description: "Get free token to test the tipping feature",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased px-4 md:px-0`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex items-center justify-center py-12">
            <Image
              src="/switched-logo.svg"
              alt="switched logo"
              width={164}
              height={31.43}
            />

          </div>
          {children}
            <p className="w-full px-4 md:px-0 text-center text-base text-gray-400 fixed bottom-6 left-1/2 transform-[translateX(-50%)]">This tool is designed for development purposes and does not distribute mainnet USD.</p>
        </ThemeProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
