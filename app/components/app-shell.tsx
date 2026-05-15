"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

type NavGroup = {
  label: string;
  match: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Вход",
    match: "/login",
    items: [{ href: "/login", label: "Вход" }],
  },
  {
    label: "Админ",
    match: "/admin",
    items: [
      { href: "/admin", label: "Главная" },
      { href: "/admin/courses", label: "Курсы" },
      { href: "/admin/groups", label: "Группы" },
      { href: "/admin/students", label: "Ученики" },
      { href: "/admin/teachers", label: "Преподаватели" },
    ],
  },
  {
    label: "Преподаватель",
    match: "/teacher",
    items: [
      { href: "/teacher", label: "Главная" },
      { href: "/teacher/groups", label: "Группы" },
      { href: "/teacher/attendance", label: "Посещаемость" },
      { href: "/teacher/students", label: "Ученики" },
      { href: "/teacher/homework", label: "ДЗ" },
      { href: "/teacher/materials", label: "Материалы" },
    ],
  },
  {
    label: "Ученик",
    match: "/student",
    items: [
      { href: "/student", label: "Главная" },
      { href: "/student/schedule", label: "Расписание" },
      { href: "/student/homework", label: "ДЗ" },
      { href: "/student/materials", label: "Материалы" },
      { href: "/student/progress", label: "Прогресс" },
      { href: "/student/attendance", label: "Посещаемость" },
      { href: "/student/payments", label: "Оплата" },
    ],
  },
];

function getCurrentNavGroup(pathname: string) {
  return navGroups.find((group) => pathname === group.match || pathname.startsWith(`${group.match}/`)) ?? navGroups[0];
}

function isActivePath(pathname: string, href: string) {
  if (href === "/login") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentNavGroup = getCurrentNavGroup(pathname);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Основная навигация">
        <Link className="brand sidebar-brand" href="/login">
          <span className="brand-mark" aria-hidden="true">
            К
          </span>
          <span>Курс</span>
        </Link>

        <nav className="sidebar-nav">
          <section className="sidebar-group">
            <h2>{currentNavGroup.label}</h2>
            <div className="sidebar-links">
              {currentNavGroup.items.map((item) => (
                <Link
                  aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                  className={isActivePath(pathname, item.href) ? "sidebar-link active" : "sidebar-link"}
                  href={item.href}
                  key={`${currentNavGroup.label}-${item.href}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </nav>
      </aside>

      <div className="app-content">
        <header className="mobile-header">
          <Link className="brand" href="/login">
            <span className="brand-mark" aria-hidden="true">
              К
            </span>
            <span>Курс</span>
          </Link>
          <nav className="nav mobile-nav" aria-label="Быстрая навигация">
            {currentNavGroup.items.map((item) => (
              <Link
                aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                href={item.href}
                key={`mobile-${currentNavGroup.label}-${item.href}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
