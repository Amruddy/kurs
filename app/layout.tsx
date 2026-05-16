import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/app/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Курс",
  description: "Рабочая система учебного учета",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
