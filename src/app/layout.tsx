import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Smart Education System",
  description: "AI-Powered Personalized Learning Platform",
};

import { AuthProvider } from "@/context/auth-context";
import { MainLayout } from "@/components/main-layout";
import { ThemeProvider } from "@/components/theme-provider";

// ... metadata ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          outfit.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
