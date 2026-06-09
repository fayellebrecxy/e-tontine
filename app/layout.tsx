import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import { ThemeProvider } from "@/components/theme-provider";
// import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "E-Tontine",
    template: "%s | E-Tontine",
  },
  description: "Gestion de tontines digitales pour groupes et communautes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={outfit.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          {/* <Toaster /> */}
          <ToastContainer position='top-right' autoClose={3500} closeOnClick pauseOnHover />

        </ThemeProvider>
      </body>
    </html>
  );
}
