import { z } from "zod";
import { VISIT_PURPOSE_VALUES } from "@/lib/guestbook";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const baseGuestVisitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama tamu wajib diisi")
    .max(120, "Nama tamu terlalu panjang"),
  institutionOrigin: z
    .string()
    .trim()
    .min(2, "Hubungan dengan mempelai wajib diisi")
    .max(160, "Hubungan dengan mempelai terlalu panjang"),
  address: z
    .string()
    .trim()
    .min(5, "Love note wajib diisi")
    .max(300, "Love note terlalu panjang"),
  purpose: z.enum(VISIT_PURPOSE_VALUES),
  otherPurposeNote: z
    .string()
    .trim()
    .max(255, "Detail ucapan tambahan terlalu panjang")
    .optional()
    .or(z.literal("")),
});

const photoSchema = z.object({
  photoBase64: z.string().trim().min(1, "Foto kenangan wajib diunggah"),
  photoMimeType: z
    .string()
    .trim()
    .regex(
      /^image\/(jpeg|jpg|png|webp)$/i,
      "Format foto kenangan harus JPG, PNG, atau WEBP",
    ),
  photoFileName: z
    .string()
    .trim()
    .min(1, "Nama file foto kenangan tidak valid")
    .max(191, "Nama file foto kenangan terlalu panjang"),
  photoSizeBytes: z
    .number({ message: "Ukuran file kenangan tidak valid" })
    .int()
    .positive()
    .max(MAX_IMAGE_SIZE_BYTES, "Ukuran foto kenangan maksimal 5MB"),
});

function validateOtherPurpose(
  data: z.infer<typeof baseGuestVisitSchema>,
  ctx: z.RefinementCtx,
) {
  if (data.purpose === "LAYANAN_LAINNYA" && !data.otherPurposeNote?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Detail ucapan wajib diisi untuk kategori Ucapan Lainnya",
      path: ["otherPurposeNote"],
    });
  }
}

export const guestVisitInputSchema = baseGuestVisitSchema
  .extend(photoSchema.shape)
  .superRefine((data, ctx) => {
    validateOtherPurpose(data, ctx);
  });

export type GuestVisitInput = z.infer<typeof guestVisitInputSchema>;

export const adminVisitUpdateSchema = baseGuestVisitSchema.superRefine(
  (data, ctx) => {
    validateOtherPurpose(data, ctx);
  },
);

export type AdminVisitUpdateInput = z.infer<typeof adminVisitUpdateSchema>;

export function sanitizePhone(phone: string): string {
  return phone.replace(/\s+/g, " ").trim();
}
