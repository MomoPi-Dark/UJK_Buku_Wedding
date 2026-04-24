export const VISIT_PURPOSE_VALUES = [
  "DOA_RESTU",
  "UCAPAN_BAHAGIA",
  "CERITA_KENANGAN",
  "NASIHAT_PERNIKAHAN",
  "DOA_KELUARGA",
  "HARAPAN_MASA_DEPAN",
  "SALAM_KEHADIRAN",
  "UCAPAN_LAINNYA",
] as const;

export type VisitPurposeValue = (typeof VISIT_PURPOSE_VALUES)[number];

export const VISIT_PURPOSE_OPTIONS: Array<{
  value: VisitPurposeValue;
  label: string;
}> = [
  { value: "DOA_RESTU", label: "Doa Restu" },
  { value: "UCAPAN_BAHAGIA", label: "Ucapan Bahagia" },
  { value: "CERITA_KENANGAN", label: "Cerita Kenangan" },
  { value: "NASIHAT_PERNIKAHAN", label: "Nasihat Pernikahan" },
  { value: "DOA_KELUARGA", label: "Doa Keluarga" },
  { value: "HARAPAN_MASA_DEPAN", label: "Harapan Masa Depan" },
  {
    value: "SALAM_KEHADIRAN",
    label: "Salam Kehadiran",
  },
  { value: "UCAPAN_LAINNYA", label: "Ucapan Lainnya" },
];

export const VISIT_PURPOSE_LABEL_MAP = new Map(
  VISIT_PURPOSE_OPTIONS.map((option) => [option.value, option.label]),
);

export function getPurposeLabel(value: VisitPurposeValue): string {
  return VISIT_PURPOSE_LABEL_MAP.get(value) ?? value;
}
