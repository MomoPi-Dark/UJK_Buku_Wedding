"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type AdminLoginFormProps = {
  nextPath?: string;
};

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await authClient.signIn.username({
        username,
        password,
      });

      if (error) {
        throw new Error(error.message || "Login gagal");
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
    <form className="card border border-primary/10 bg-base-100 shadow-xl" onSubmit={handleSubmit}>
      <div className="card-body gap-4 p-5 md:p-7">
        <h1 className="text-2xl font-semibold text-primary">Login Admin TU</h1>
        <label className="form-control w-full">
          <span className="label text-sm">Username</span>
          <input
            className="input input-bordered w-full"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
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

        <button className="btn btn-primary h-12 text-base" type="submit" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </div>
    </form>
  );
}
