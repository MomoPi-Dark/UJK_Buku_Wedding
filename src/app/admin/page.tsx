import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminLogoutButton } from "@/components/admin-logout-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="navbar rounded-box bg-base-100 shadow-sm">
          <div className="flex-1">
            <p className="text-lg font-semibold text-primary">Admin TU MAN 2</p>
          </div>
          <AdminLogoutButton />
        </div>

        <AdminDashboard />
      </div>
    </main>
  );
}
