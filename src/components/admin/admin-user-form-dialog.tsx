"use client";

import { FormEvent, useState } from "react";

type AdminUserFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

export function AdminUserFormDialog({
  open,
  onClose,
  onSaved,
}: AdminUserFormDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message ?? "Gagal menambahkan admin");
      }

      await onSaved();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menambahkan admin",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={(event) => {
        if (event.currentTarget === event.target && !loading) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div className="w-full max-w-lg rounded-box bg-base-100 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-base-300 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-primary">
                  Tambah Admin User
                </h2>
                <p className="text-sm opacity-70">
                  Buat akun admin baru untuk login ke dashboard.
                </p>
              </div>
              <button
                className="btn btn-sm btn-outline"
                type="button"
                onClick={onClose}
                disabled={loading}
              >
                Tutup
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-5">
            <label className="form-control w-full">
              <span className="label text-sm">Email Admin</span>
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
              <span className="label text-sm">Nama Admin</span>
              <input
                className="input input-bordered w-full"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
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
                autoComplete="new-password"
                required
              />
            </label>

            <p className="text-sm opacity-70">
              Akun ini akan langsung login memakai email dan password Better
              Auth.
            </p>

            {error ? (
              <div className="alert alert-error py-2">{error}</div>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={onClose}
                disabled={loading}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Menyimpan..." : "Simpan Admin"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
