import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { getAdminSession } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="navbar rounded-box bg-base-100 shadow-sm">
          <div className="flex-1">
            <Link href={"/"}>
              <span className="pl-5 text-lg font-semibold text-primary">
                Dashboard
              </span>
            </Link>
          </div>
          <div className="pr-5">
            <AdminLogoutButton />
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
