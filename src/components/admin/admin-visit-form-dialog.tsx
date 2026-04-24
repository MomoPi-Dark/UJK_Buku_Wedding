"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { VISIT_PURPOSE_OPTIONS } from "@/lib/guestbook";
import { MAX_IMAGE_SIZE_BYTES, adminVisitUpdateSchema } from "@/lib/validation";

type VisitFormValue = {
  id?: number;
  name: string;
  institutionOrigin: string;
  address: string;
  purpose: (typeof VISIT_PURPOSE_OPTIONS)[number]["value"];
  otherPurposeNote: string;
};

type AdminVisitFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  initialValue: VisitFormValue | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

type CreatePhotoState = {
  photoBase64: string;
  photoMimeType: string;
  photoFileName: string;
  photoSizeBytes: number;
};

const EMPTY_FORM: VisitFormValue = {
  name: "",
  institutionOrigin: "",
  address: "",
  purpose: "DOA_RESTU",
  otherPurposeNote: "",
};

const EMPTY_PHOTO: CreatePhotoState = {
  photoBase64: "",
  photoMimeType: "",
  photoFileName: "",
  photoSizeBytes: 0,
};

export function AdminVisitFormDialog({
  mode,
  open,
  initialValue,
  onClose,
  onSaved,
}: AdminVisitFormDialogProps) {
  const [form, setForm] = useState<VisitFormValue>(initialValue ?? EMPTY_FORM);
  const [photo, setPhoto] = useState<CreatePhotoState>(EMPTY_PHOTO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsOtherPurpose = useMemo(
    () => form.purpose === "UCAPAN_LAINNYA",
    [form.purpose],
  );

  if (!open) {
    return null;
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPhoto(EMPTY_PHOTO);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Ukuran foto maksimal 5MB");
      event.target.value = "";
      return;
    }

    const photoBase64 = await fileToBase64(file);
    setPhoto({
      photoBase64,
      photoMimeType: file.type,
      photoFileName: file.name,
      photoSizeBytes: file.size,
    });
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const validation = adminVisitUpdateSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Data tidak valid");
      setLoading(false);
      return;
    }

    try {
      const payload =
        mode === "create"
          ? {
              ...form,
              ...photo,
            }
          : form;

      const response = await fetch(
        mode === "create"
          ? "/api/admin/visits"
          : `/api/admin/visits/${form.id}`,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all"
      onClick={(event) => {
        if (event.currentTarget === event.target && !loading) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div className="w-full max-w-3xl rounded-box bg-base-100 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-base-300 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-primary">
                  {mode === "create" ? "Tambah Data Tamu" : "Edit Data Tamu"}
                </h2>
                <p className="text-sm opacity-70">
                  Kelola data tamu dan pesan yang tampil di memory wall.
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
              <span className="label text-sm font-medium">
                Nama Tamu / Penulis
              </span>
              <input
                className="input input-bordered"
                placeholder="Masukkan nama tamu"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </label>

            <label className="form-control w-full">
              <span className="label text-sm font-medium">
                Grup / Hubungan (Keluarga, dll)
              </span>
              <input
                className="input input-bordered"
                placeholder="Contoh: Sahabat Kuliah, Keluarga Mempelai Pria"
                value={form.institutionOrigin}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    institutionOrigin: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="form-control w-full">
              <span className="label text-sm font-medium">
                Kategori Pesan (Ikon)
              </span>
              <select
                className="select select-bordered"
                value={form.purpose}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    purpose: event.target.value as VisitFormValue["purpose"],
                  }))
                }
              >
                {VISIT_PURPOSE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control w-full md:col-span-2">
              <span className="label text-sm font-medium">
                Pesan &amp; Doa Restu
              </span>
              <textarea
                className="textarea textarea-bordered min-h-28 text-base leading-relaxed"
                placeholder="Tuliskan ucapan, doa, atau kenangan untuk mempelai..."
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                required
              />
            </label>

            {needsOtherPurpose ? (
              <label className="form-control w-full md:col-span-2">
                <span className="label text-sm font-medium">
                  Detail Kategori Lainnya
                </span>
                <input
                  className="input input-bordered"
                  placeholder="Sebutkan kategori lainnya..."
                  value={form.otherPurposeNote}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      otherPurposeNote: event.target.value,
                    }))
                  }
                  required
                />
              </label>
            ) : null}

            {mode === "create" ? (
              <label className="form-control w-full md:col-span-2">
                <span className="label text-sm font-medium">
                  Foto Bukti Kehadiran / Momen
                </span>
                <input
                  className="file-input file-input-bordered w-full"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => void handleFileChange(event)}
                  required
                />
                {photo.photoFileName ? (
                  <span className="mt-2 text-xs opacity-70">
                    File terpilih: {photo.photoFileName}
                  </span>
                ) : null}
              </label>
            ) : null}
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
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Menyimpan...
                </>
              ) : mode === "create" ? (
                "Simpan Data"
              ) : (
                "Update Data"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.replace(/^data:.*;base64,/, ""));
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}
