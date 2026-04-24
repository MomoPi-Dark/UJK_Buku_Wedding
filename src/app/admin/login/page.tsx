import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { ensureAdminUser, getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  await ensureAdminUser();

  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  const resolvedSearchParams = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-base-200">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(47,160,132,0.2), transparent 38%), radial-gradient(circle at 100% 100%, rgba(31,111,95,0.15), transparent 34%)",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:py-10 lg:grid-cols-[1.05fr_440px] lg:items-center lg:px-8 lg:py-14">
        <section className="order-2 hidden rounded-box border border-primary/10 bg-gradient-to-br from-primary to-secondary p-8 text-primary-content shadow-xl lg:order-1 lg:block">
          <p className="badge badge-accent badge-outline w-fit">AREA ADMIN</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Panel Admin
          </h1>
          <p className="mt-3 max-w-md text-primary-content/90">
            Login untuk melihat dashboard kunjungan, statistik, dan preview foto
            tamu tanpa keluar halaman.
          </p>
        </section>

        <div className="order-1 w-full max-w-md justify-self-center lg:order-2 lg:max-w-xl lg:justify-self-end">
          <AdminLoginForm nextPath={resolvedSearchParams.next} />
        </div>
      </div>
    </main>
  );
}
