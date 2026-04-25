"use client";

import { FormEvent, useEffect, useState } from "react";

export type UndanganFormValue = {
  id?: string;
  fileId: string;
  fileName: string;
  folderPath: string;
  mimeType: string;
  sizeBytes: string;
  uploadedAt: string;
};

type AdminUndanganFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  initialValue: UndanganFormValue | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

const EMPTY_FORM: UndanganFormValue = {
  fileId: "",
  fileName: "",
  folderPath: "",
  mimeType: "application/pdf",
  sizeBytes: "0",
  uploadedAt: "",
};

export function AdminUndanganFormDialog({
  mode,
  open,
  initialValue,
  onClose,
  onSaved,
}: AdminUndanganFormDialogProps) {
  const [form, setForm] = useState<UndanganFormValue>(
    initialValue ?? EMPTY_FORM,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(initialValue ?? EMPTY_FORM);
    setError(null);
  }, [initialValue, open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      fileId: form.fileId.trim(),
      fileName: form.fileName.trim(),
      folderPath: form.folderPath.trim(),
      mimeType: form.mimeType.trim(),
      sizeBytes: Number(form.sizeBytes),
      uploadedAt: new Date(form.uploadedAt).toISOString(),
    };

    if (!Number.isFinite(payload.sizeBytes) || payload.sizeBytes < 0) {
      setError("Ukuran file harus angka 0 atau lebih");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        mode === "create"
          ? "/api/admin/management-undangan"
          : `/api/admin/management-undangan/${form.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const json = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message ?? "Gagal menyimpan data");
      }

      await onSaved();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan data",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.currentTarget === event.target && !loading) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div className="w-full max-w-2xl rounded-box bg-base-100 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-base-300 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-primary">
                  {mode === "create"
                    ? "Tambah Data Undangan"
                    : "Edit Data Undangan"}
                </h2>
                <p className="text-sm opacity-70">
                  Simpan metadata file undangan untuk kebutuhan manajemen.
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

          <div className="grid gap-4 p-5 md:grid-cols-2">
            <label className="form-control w-full">
              <span className="label text-sm font-medium">File ID</span>
              <input
                className="input input-bordered"
                value={form.fileId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fileId: event.target.value }))
                }
                required
              />
            </label>

            <label className="form-control w-full">
              <span className="label text-sm font-medium">Nama File</span>
              <input
                className="input input-bordered"
                value={form.fileName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fileName: event.target.value }))
                }
                required
              />
            </label>

            <label className="form-control w-full md:col-span-2">
              <span className="label text-sm font-medium">Folder Path</span>
              <input
                className="input input-bordered"
                value={form.folderPath}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    folderPath: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="form-control w-full">
              <span className="label text-sm font-medium">MIME Type</span>
              <input
                className="input input-bordered"
                value={form.mimeType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, mimeType: event.target.value }))
                }
                required
              />
            </label>

            <label className="form-control w-full">
              <span className="label text-sm font-medium">
                Ukuran File (bytes)
              </span>
              <input
                className="input input-bordered"
                type="number"
                min="0"
                value={form.sizeBytes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    sizeBytes: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="form-control w-full md:col-span-2">
              <span className="label text-sm font-medium">Waktu Upload</span>
              <input
                className="input input-bordered"
                type="datetime-local"
                value={form.uploadedAt}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    uploadedAt: event.target.value,
                  }))
                }
                required
              />
            </label>
          </div>

          {error ? (
            <div className="px-5 pb-4 text-sm text-error">{error}</div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-base-300 px-5 py-4">
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
              {loading
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan"
                  : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
