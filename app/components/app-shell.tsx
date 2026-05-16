import Link from "next/link";
import type { ReactNode } from "react";
import { AppNavLink, type NavIcon } from "@/app/components/app-nav-link";
import {
  getCurrentSession,
  isDevLoginEnabled,
  workspaceConfig,
  type DevSession,
  type WorkspaceRole,
} from "@/app/lib/dev-auth";
import { switchWorkspace } from "@/app/login/actions";

type NavItem = {
  href: string;
  icon: NavIcon;
  label: string;
};

const navByWorkspace: Record<WorkspaceRole, NavItem[]> = {
  admin: [
    { href: "/admin", icon: "overview", label: "Обзор" },
    { href: "/admin/courses", icon: "courses", label: "Курсы" },
    { href: "/admin/groups", icon: "groups", label: "Группы" },
    { href: "/admin/students", icon: "students", label: "Ученики" },
    { href: "/admin/teachers", icon: "teachers", label: "Преподаватели" },
    { href: "/admin/payments", icon: "payments", label: "Оплата" },
  ],
  teacher: [
    { href: "/teacher", icon: "overview", label: "Обзор" },
    { href: "/teacher/groups", icon: "groups", label: "Группы" },
    { href: "/teacher/students", icon: "students", label: "Ученики" },
    { href: "/teacher/attendance", icon: "attendance", label: "Посещаемость" },
    { href: "/teacher/homework", icon: "homework", label: "Домашние задания" },
    { href: "/teacher/materials", icon: "materials", label: "Материалы" },
    { href: "/teacher/payments", icon: "payments", label: "Оплата" },
  ],
  student: [
    { href: "/student", icon: "overview", label: "Обзор" },
    { href: "/student/schedule", icon: "calendar", label: "Расписание" },
    { href: "/student/homework", icon: "homework", label: "Домашние задания" },
    { href: "/student/materials", icon: "materials", label: "Материалы" },
    { href: "/student/progress", icon: "progress", label: "Прогресс" },
    { href: "/student/attendance", icon: "attendance", label: "Посещаемость" },
    { href: "/student/payments", icon: "payments", label: "Оплата" },
  ],
};

const publicNav: NavItem[] = [{ href: "/login", icon: "login", label: "Вход" }];

function WorkspaceSwitcher({ session }: { session: DevSession }) {
  if (session.roles.length < 2) {
    return null;
  }

  return (
    <div className="workspace-switch">
      <p className="sidebar-label">Рабочая область</p>
      <div className="workspace-switch-list">
        {session.roles.map((role) => (
          <form action={switchWorkspace.bind(null, role)} key={role}>
            <button className="workspace-switch-button" type="submit" disabled={role === session.activeWorkspace}>
              {workspaceConfig[role].label}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}

function Sidebar({ items, session }: { items: NavItem[]; session: DevSession | null }) {
  const homePath = session ? workspaceConfig[session.activeWorkspace].homePath : "/login";
  const workspaceLabel = session ? workspaceConfig[session.activeWorkspace].label : "Вход";
  const showDevLogin = isDevLoginEnabled();

  return (
    <aside className="sidebar" aria-label="Основная навигация">
      <Link className="brand" href={homePath}>
        <span className="brand-mark">D</span>
        <span className="brand-text">Deshar</span>
      </Link>

      <div className="sidebar-section">
        <p className="sidebar-label">Разделы</p>
        <nav className="side-nav" aria-label="Разделы">
          {items.map((item) => (
            <AppNavLink href={item.href} icon={item.icon} label={item.label} key={item.href} />
          ))}
        </nav>
      </div>

      {session ? <WorkspaceSwitcher session={session} /> : null}

      <div className="sidebar-card">
        <span className="status">{workspaceLabel}</span>
        {session ? (
          <>
            <strong>{session.name}</strong>
            <p>{session.organizationName}</p>
          </>
        ) : (
          <>
            <strong>{showDevLogin ? "Тестовый режим" : "Авторизация"}</strong>
            <p>{showDevLogin ? "Выберите роль для ручной проверки MVP." : "Войдите в рабочий кабинет."}</p>
          </>
        )}
      </div>
    </aside>
  );
}

function WorkspaceTopbar({ session }: { session: DevSession | null }) {
  const title = session ? workspaceConfig[session.activeWorkspace].label : "Вход";
  const subtitle = session ? session.email : isDevLoginEnabled() ? "Тестовая авторизация" : "Рабочая авторизация";

  return (
    <header className="workspace-topbar">
      <div>
        <span className="topbar-kicker">Deshar</span>
        <strong>{title}</strong>
      </div>
      <span className="topbar-user">{subtitle}</span>
    </header>
  );
}

function MobileNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="mobile-nav" aria-label="Мобильная навигация">
      {items.map((item) => (
        <AppNavLink href={item.href} icon={item.icon} label={item.label} key={item.href} />
      ))}
    </nav>
  );
}

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  const items = session ? navByWorkspace[session.activeWorkspace] : publicNav;

  return (
    <div className="app-shell">
      <Sidebar items={items} session={session} />
      <div className="workspace">
        <WorkspaceTopbar session={session} />
        <main className="main">{children}</main>
      </div>
      <MobileNav items={items} />
    </div>
  );
}
