"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavIcon =
  | "overview"
  | "courses"
  | "groups"
  | "students"
  | "teachers"
  | "calendar"
  | "attendance"
  | "homework"
  | "materials"
  | "progress"
  | "payments"
  | "login";

type AppNavLinkProps = {
  href: string;
  icon: NavIcon;
  label: string;
};

function Icon({ icon }: { icon: NavIcon }) {
  if (icon === "overview") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h7v6H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 13h7v6H4z" />
      </svg>
    );
  }

  if (icon === "courses") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Zm1 13h10V6H7v11Zm1-8h7M8 12h6" />
      </svg>
    );
  }

  if (icon === "groups" || icon === "students" || icon === "teachers") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19a5 5 0 0 1 10 0H3Zm10 0a4 4 0 0 1 7-2.6" />
      </svg>
    );
  }

  if (icon === "calendar") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4v3M18 4v3M4 9h16M6 6h12a2 2 0 0 1 2 2v11H4V8a2 2 0 0 1 2-2Zm3 7h2M13 13h2M9 16h2M13 16h2" />
      </svg>
    );
  }

  if (icon === "attendance") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5h14v14H5zM8 9h8M8 13h5M8 17h3M15 16l1.5 1.5L20 14" />
      </svg>
    );
  }

  if (icon === "homework") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4h10l2 2v14H6zM15 4v3h3M9 10h6M9 14h6M9 18h4" />
      </svg>
    );
  }

  if (icon === "materials") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6h14v13H5zM8 4h8v4H8zM8 12h8M8 16h5" />
      </svg>
    );
  }

  if (icon === "progress") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 18V6M5 18h14M9 15v-4M13 15V8M17 15v-7" />
      </svg>
    );
  }

  if (icon === "payments") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16v10H4zM4 10h16M8 14h4M16 14h1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6h9v12H9M14 12H4M7 9l-3 3 3 3" />
    </svg>
  );
}

export function AppNavLink({ href, icon, label }: AppNavLinkProps) {
  const pathname = usePathname();
  const isWorkspaceHome = href === "/admin" || href === "/teacher" || href === "/student";
  const isActive = pathname === href || (!isWorkspaceHome && Boolean(pathname?.startsWith(`${href}/`)));

  return (
    <Link className="app-nav-link" href={href} aria-current={isActive ? "page" : undefined} data-active={isActive}>
      <span className="app-nav-icon">
        <Icon icon={icon} />
      </span>
      <span>{label}</span>
    </Link>
  );
}
