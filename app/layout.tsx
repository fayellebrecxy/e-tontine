import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "E-Tontine",
    template: "%s | E-Tontine",
  },
  description: "Gestion de tontines digitales pour groupes et communautes.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className={`${inter.className} font-sans antialiased text-foreground bg-background`}>
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            {children}
            <ToastContainer position="top-right" autoClose={3500} closeOnClick pauseOnHover />
            <Toaster richColors closeButton position="top-right" />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
