import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Курс",
  description: "Рабочая система учебного учета",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="brand" href="/login">
                Курс
              </Link>
              <nav className="nav" aria-label="Основная навигация">
                <Link href="/login">Вход</Link>
                <Link href="/admin">Админ</Link>
                <Link href="/admin/courses">Курсы</Link>
                <Link href="/admin/groups">Группы</Link>
                <Link href="/admin/students">Ученики</Link>
                <Link href="/teacher">Преподаватель</Link>
                <Link href="/teacher/groups">Мои группы</Link>
                <Link href="/student">Ученик</Link>
              </nav>
            </div>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
