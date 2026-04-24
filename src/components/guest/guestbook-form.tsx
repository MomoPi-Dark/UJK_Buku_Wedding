"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { VISIT_PURPOSE_OPTIONS } from "@/lib/guestbook";
import { guestVisitInputSchema, guestVisitPhotoSchema } from "@/lib/validation";

type SubmitState = "idle" | "loading" | "success" | "error";

type FormDataState = {
  name: string;
  relation: string;
  address: string;
  purpose: (typeof VISIT_PURPOSE_OPTIONS)[number]["value"];
  otherPurposeNote: string;
  photoBase64: string;
  photoMimeType: string;
  photoFileName: string;
  photoSizeBytes: number;
};

type GuestbookFormProps = {
  onPosted?: () => void;
};

const QUICK_PURPOSE: Array<{ label: string; value: FormDataState["purpose"] }> =
  [
    { label: "Doa", value: "DOA_RESTU" },
    { label: "Ucapan Bahagia", value: "UCAPAN_BAHAGIA" },
    { label: "Kenangan", value: "CERITA_KENANGAN" },
    { label: "Lainnya", value: "UCAPAN_LAINNYA" },
  ];

const DEFAULT_STATE: FormDataState = {
  name: "",
  relation: "Sahabat Mempelai",
  address: "",
  purpose: "DOA_RESTU",
  otherPurposeNote: "",
  photoBase64: "",
  photoMimeType: "",
  photoFileName: "",
  photoSizeBytes: 0,
};

export function GuestbookForm({ onPosted }: GuestbookFormProps) {
  const [form, setForm] = useState<FormDataState>(DEFAULT_STATE);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);

  const needsOtherPurpose = useMemo(
    () => form.purpose === "UCAPAN_LAINNYA",
    [form.purpose],
  );

  function resetFileInputs() {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
    if (desktopInputRef.current) {
      desktopInputRef.current.value = "";
    }
  }

  async function onPhotoChange(file: File | null) {
    if (!file) {
      setForm((prev) => ({
        ...prev,
        photoBase64: "",
        photoMimeType: "",
        photoFileName: "",
        photoSizeBytes: 0,
      }));
      return;
    }

    const base64 = await fileToBase64(file);
    const photoValidation = guestVisitPhotoSchema.safeParse({
      photoBase64: base64,
      photoMimeType: file.type,
      photoFileName: file.name,
      photoSizeBytes: file.size,
    });

    if (!photoValidation.success) {
      setSubmitState("error");
      setMessage(
        photoValidation.error.issues[0]?.message ?? "Foto kenangan tidak valid",
      );
      resetFileInputs();
      return;
    }

    setSubmitState("idle");
    setMessage("");
    setForm((prev) => ({
      ...prev,
      ...photoValidation.data,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = guestVisitInputSchema.safeParse(form);

    if (!validation.success) {
      setSubmitState("error");
      setMessage(
        validation.error.issues[0]?.message ?? "Data form tidak valid",
      );
      return;
    }

    setSubmitState("loading");
    setMessage("Mengirim love note...");

    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const json = (await response.json()) as {
        ok: boolean;
        error?: { message?: string };
      };
      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message ?? "Gagal menyimpan data");
      }

      setSubmitState("success");
      setMessage(
        "Surat dan doa Anda berhasil dikirim! Terima kasih telah berbagi kebahagiaan.",
      );
      setForm(DEFAULT_STATE);
      setIsAnonymous(false);
      resetFileInputs();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("guestbook:posted"));
      }
      onPosted?.();
    } catch (error) {
      setSubmitState("error");
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  }

  function toggleAnonymousMode(enabled: boolean) {
    setIsAnonymous(enabled);
    if (enabled) {
      setForm((prev) => ({ ...prev, name: "Tamu Rahasia" }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: prev.name === "Tamu Rahasia" ? "" : prev.name,
    }));
  }

  return (
    <motion.form
      id="love-note-form"
      noValidate
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-4xl border border-primary/15 bg-[linear-gradient(180deg,rgba(255,251,248,0.94),rgba(255,247,242,0.86))] shadow-[0_26px_70px_rgba(94,63,75,0.12)] backdrop-blur"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(183,110,121,0.08),transparent)]" />
      <div className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rounded-full bg-secondary/18 blur-3xl" />

      <div className="relative flex flex-col gap-6 p-5 md:p-7">
        <div className="space-y-3 border-b border-primary/10 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-accent text-3xl text-secondary md:text-4xl">
                Write With Love
              </p>
              <h2 className="mt-1 font-heading text-3xl leading-none text-primary">
                Berikan Ucapan Untuk Mempelai
              </h2>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 opacity-80">
            Tuliskan sebuah doa, kenangan indah, atau ucapan selamat yang hangat
            untuk pengantin. Biarkan kata-kata Anda menjadi bagian dari kenangan
            abadi mereka.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="form-control w-full">
            <span className="label text-sm text-foreground/78">Nama</span>
            <input
              className="input h-12 w-full rounded-2xl border-primary/12 bg-base-100/88"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder={
                isAnonymous
                  ? "Nama akan disembunyikan sebagai 'Tamu Rahasia'"
                  : "Contoh: Siti Nurhaliza / Sahabat Dekat / Rekan Kerja"
              }
              readOnly={isAnonymous}
              required
            />
          </label>

          <label className="form-control w-full">
            <span className="label text-sm text-foreground/78">
              Nama Tamu Rahasia
            </span>
            <div className="flex h-12 items-center justify-between rounded-2xl border border-primary/12 bg-base-100/74 px-4">
              <span className="text-sm">Anonymous</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={isAnonymous}
                onChange={(event) => toggleAnonymousMode(event.target.checked)}
              />
            </div>
          </label>

          <div className="form-control w-full md:col-span-2">
            <span className="label text-sm text-foreground/78">
              Pilih Nuansa Ucapan
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PURPOSE.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    form.purpose === item.value
                      ? "border-secondary/10 bg-secondary text-secondary-content shadow-sm"
                      : "border-primary/12 bg-base-100/72 text-foreground/76 hover:border-primary/25"
                  }`}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, purpose: item.value }))
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-primary/12 bg-base-100/76 p-4 shadow-sm md:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-primary">
                  Sedikit Tentang Kamu
                </p>
                <p className="text-xs opacity-70">
                  Detail-detail ini membantu pasangan tersebut mengingat makna
                  di balik setiap catatan.
                </p>
              </div>
            </div>

            <div className="w-full">
              <label className="form-control w-full">
                <span className="label text-sm text-foreground/78">
                  Hubungan Anda dengan Pasangan Tersebut
                </span>
                <input
                  className="input h-12 w-full rounded-2xl border-primary/12 bg-base-100/88"
                  value={form.relation}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      relation: event.target.value,
                    }))
                  }
                  placeholder="Example: College friend / Family / Colleague"
                  required
                />
              </label>

              <label className="form-control w-full md:col-span-2">
                <span className="label text-sm text-foreground/78">
                  Full Blessing Category
                </span>
                <select
                  className="select h-12 w-full rounded-2xl border-primary/12 bg-base-100/88"
                  value={form.purpose}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      purpose: event.target.value as FormDataState["purpose"],
                    }))
                  }
                  required
                >
                  {VISIT_PURPOSE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {needsOtherPurpose ? (
                <label className="form-control w-full md:col-span-2">
                  <span className="label text-sm text-foreground/78">
                    Additional Blessing Detail
                  </span>
                  <textarea
                    className="textarea min-h-20 w-full rounded-2xl border-primary/12 bg-base-100/88"
                    value={form.otherPurposeNote}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        otherPurposeNote: event.target.value,
                      }))
                    }
                    required={needsOtherPurpose}
                  />
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <label className="form-control w-full">
            <span className="label text-sm text-foreground/78">Surat mu</span>
            <div className="rounded-[1.7rem] border border-primary/12 bg-[linear-gradient(180deg,rgba(255,251,248,0.95),rgba(249,241,235,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-accent text-2xl text-secondary">
                  Dear Alya &amp; Raka,
                </p>
                <span className="text-[11px] uppercase tracking-[0.24em] text-primary/55">
                  pesan yang tulus
                </span>
              </div>
              <textarea
                className="textarea min-h-36 w-full border-none bg-transparent p-0 text-base leading-7 text-foreground/82 focus:outline-none"
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                placeholder="Semoga rumahmu dipenuhi dengan kehangatan, tawa, dan cinta yang semakin indah seiring berjalannya waktu..."
                required
              />
              <div className="mt-2 flex items-center justify-between border-t border-primary/10 pt-2 text-xs opacity-75">
                <span>Tuliskan setidaknya beberapa kata doa dan harapan</span>
                <span>{form.address.length} karakter</span>
              </div>
            </div>
          </label>

          <label className="form-control w-full">
            <span className="label text-sm text-foreground/78">
              Bukti Undangan Anda
            </span>

            <div className="space-y-2 md:hidden">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="btn btn-outline rounded-full"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Open Camera
                </button>
                <button
                  type="button"
                  className="btn btn-outline rounded-full"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  Choose From Gallery
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
                capture="environment"
                className="hidden"
                onChange={(event) =>
                  void onPhotoChange(event.target.files?.[0] ?? null)
                }
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
                className="hidden"
                onChange={(event) =>
                  void onPhotoChange(event.target.files?.[0] ?? null)
                }
              />
            </div>

            <input
              ref={desktopInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
              className="file-input hidden w-full rounded-full border-primary/12 bg-base-100/88 md:flex"
              onChange={(event) =>
                void onPhotoChange(event.target.files?.[0] ?? null)
              }
            />

            <div className="flex flex-col pt-2">
              <span className="label-text-alt mt-1 text-xs opacity-70">
                Add a small photo keepsake. Maximum 5MB in JPG, PNG, or WEBP.
              </span>
              {form.photoFileName ? (
                <span className="label-text-alt mt-1 text-xs text-primary">
                  Selected file: {form.photoFileName}
                </span>
              ) : null}
            </div>
          </label>
        </div>

        {submitState !== "idle" ? (
          <div
            className={`rounded-[1.4rem] border px-4 py-3 text-sm ${
              submitState === "success"
                ? "border-success/20 bg-success/12 text-success"
                : submitState === "error"
                  ? "border-error/20 bg-error/10 text-error"
                  : "border-info/20 bg-info/10 text-info"
            }`}
          >
            {message}
          </div>
        ) : null}

        <button
          className="btn btn-primary h-13 rounded-full px-6 text-base shadow-sm"
          type="submit"
          disabled={submitState === "loading"}
        >
          {submitState === "loading"
            ? "Mengirimkan Ucapan & Doa..."
            : "Kirimkan Ucapan & Doa"}
        </button>
      </div>
    </motion.form>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value !== "string") {
        reject(new Error("Gagal membaca file"));
        return;
      }
      const base64 = value.split(",")[1];
      resolve(base64 ?? "");
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}
