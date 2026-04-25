import Link from "next/link";
import type { ReactNode } from "react";

type AdminDashboardShellProps = {
  activeSection: "overview" | "users" | "undangan";
  rightAction?: ReactNode;
  children: ReactNode;
};

export function AdminDashboardShell({
  activeSection,
  rightAction,
  children,
}: AdminDashboardShellProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="card h-fit bg-base-100 shadow-sm">
        <div className="card-body gap-2 p-3">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide opacity-60">
            Menu
          </p>
          <Link
            href="/admin/dashboard/overview"
            className={`btn justify-start ${activeSection === "overview" ? "btn-primary" : "btn-ghost"}`}
          >
            Overview
          </Link>
          <Link
            href="/admin/dashboard/users"
            className={`btn justify-start ${activeSection === "users" ? "btn-primary" : "btn-ghost"}`}
          >
            Users
          </Link>
          <Link
            href="/admin/dashboard/undangan"
            className={`btn justify-start ${activeSection === "undangan" ? "btn-primary" : "btn-ghost"}`}
          >
            Undangan
          </Link>
        </div>
      </aside>

      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              Admin Memory Studio
            </h1>
            <p className="text-sm opacity-70">
              Kelola love notes, statistik, dan akun admin dari satu panel.
            </p>
          </div>
          {rightAction ? (
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {rightAction}
            </div>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  );
}
