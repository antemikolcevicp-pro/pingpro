import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PingPro - Privatni Trening (Stolni Tenis)",
  description: "Rezervirajte svoj termin za privatni trening stolnog tenisa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr">
      <body className={inter.className}>
        <Providers>
          <Navigation />
          <main className="container">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
