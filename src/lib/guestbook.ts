export const VISIT_PURPOSE_VALUES = [
  "OBSERVASI_PPL_WAWANCARA",
  "PENAWARAN",
  "MENGANTAR_SURAT_PERANTARA",
  "INFORMASI_PMB",
  "LEGALISIR",
  "KONSULTASI_PENDIDIKAN",
  "PENJENGUKAN_SANTRI_SANTRIWATI",
  "LAYANAN_LAINNYA",
] as const;

export type VisitPurposeValue = (typeof VISIT_PURPOSE_VALUES)[number];

export const VISIT_PURPOSE_OPTIONS: Array<{
  value: VisitPurposeValue;
  label: string;
}> = [
  { value: "OBSERVASI_PPL_WAWANCARA", label: "Doa Restu" },
  { value: "PENAWARAN", label: "Ucapan Bahagia" },
  { value: "MENGANTAR_SURAT_PERANTARA", label: "Cerita Kenangan" },
  { value: "INFORMASI_PMB", label: "Nasihat Pernikahan" },
  { value: "LEGALISIR", label: "Doa Keluarga" },
  { value: "KONSULTASI_PENDIDIKAN", label: "Harapan Masa Depan" },
  {
    value: "PENJENGUKAN_SANTRI_SANTRIWATI",
    label: "Salam Kehadiran",
  },
  { value: "LAYANAN_LAINNYA", label: "Ucapan Lainnya" },
];

export const VISIT_PURPOSE_LABEL_MAP = new Map(
  VISIT_PURPOSE_OPTIONS.map((option) => [option.value, option.label]),
);

export function getPurposeLabel(value: VisitPurposeValue): string {
  return VISIT_PURPOSE_LABEL_MAP.get(value) ?? value;
}
