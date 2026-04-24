"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type AdminLoginFormProps = {
  nextPath?: string;
  initialEmail?: string;
};

export function AdminLoginForm({
  nextPath,
  initialEmail = "",
}: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response = await authClient.signIn.email({
        email,
        password,
      });

      if (response.error) {
        const bootstrapResponse = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (bootstrapResponse.ok) {
          response = await authClient.signIn.email({
            email,
            password,
          });
        }
      }

      if (response.error) {
        throw new Error(response.error.message ?? "Login gagal");
      }

      router.push(nextPath?.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="card border border-primary/10 bg-base-100 shadow-xl"
      onSubmit={handleSubmit}
    >
      <div className="card-body gap-4 p-5 md:p-7">
        <h1 className="text-2xl font-semibold text-primary">Login Admin TU</h1>
        <p className="text-sm opacity-70">
          Semua akun admin masuk memakai email dan password Better Auth.
          Login pertama admin default akan dimigrasikan otomatis.
        </p>
        <label className="form-control w-full">
          <span className="label text-sm">Email</span>
          <input
            className="input input-bordered w-full"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="form-control w-full">
          <span className="label text-sm">Password</span>
          <input
            className="input input-bordered w-full"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error ? <div className="alert alert-error py-2">{error}</div> : null}

        <button
          className="btn btn-primary h-12 text-base"
          type="submit"
          disabled={loading}
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </div>
    </form>
  );
}
