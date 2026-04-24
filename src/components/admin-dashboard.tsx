"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminVisitFormDialog } from "@/components/admin-visit-form-dialog";
import { getPurposeLabel } from "@/lib/guestbook";
import { formatIdDateTime } from "@/lib/time";
import type { VisitPurposeValue } from "@/lib/guestbook";

type DashboardData = {
  totals: {
    range: number;
    today: number;
    week: number;
    month: number;
  };
  chart: Array<{ date: string; total: number }>;
  purpose: Array<{ purpose: VisitPurposeValue; total: number }>;
  latestVisits: Array<{
    id: number;
    name: string;
    institutionOrigin: string;
    address: string;
    phone: string;
    purpose: VisitPurposeValue;
    otherPurposeNote: string | null;
    photoFolderPath: string;
    visitAt: string;
  }>;
};

const RANGE_OPTIONS = [
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "90d", label: "90 Hari" },
] as const;

const PIE_COLORS = [
  "#1F6F5F",
  "#2FA084",
  "#6FCF97",
  "#4E9DFF",
  "#EB9F22",
  "#CF3F5F",
  "#7D6BE8",
  "#46B3C6",
];

export function AdminDashboard() {
  const [range, setRange] =
    useState<(typeof RANGE_OPTIONS)[number]["value"]>("30d");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    id: number;
    name: string;
    visitAt: string;
  } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingVisit, setEditingVisit] = useState<DashboardData["latestVisits"][number] | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/dashboard?range=${range}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as {
        ok: boolean;
        data?: DashboardData;
        error?: { message?: string };
      };
      if (!response.ok || !json.ok || !json.data) {
        throw new Error(json.error?.message ?? "Gagal memuat dashboard");
      }
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
        setPhotoError(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedPhoto]);

  async function handleDeleteVisit(
    visit: DashboardData["latestVisits"][number],
  ) {
    const confirmed = window.confirm(
      `Hapus kunjungan ${visit.name} pada ${formatIdDateTime(new Date(visit.visitAt))}? Foto juga akan dihapus dari Drive.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(visit.id);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/admin/visits/${visit.id}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };
      if (!response.ok || !json.ok) {
        throw new Error(
          json.error?.message ?? "Gagal menghapus data kunjungan",
        );
      }

      if (selectedPhoto?.id === visit.id) {
        setSelectedPhoto(null);
        setPhotoError(null);
      }

      setActionMessage({
        type: "success",
        text: `Data ${visit.name} berhasil dihapus`,
      });

      await loadDashboard();
    } catch (err) {
      setActionMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Gagal menghapus data kunjungan",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-primary">
          Dashboard Buku Tamu
        </h1>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingVisit(null);
              setDialogMode("create");
            }}
          >
            Tambah Data
          </button>
          <div className="join">
            {RANGE_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`btn join-item btn-sm ${range === item.value ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setRange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="skeleton h-96 w-full rounded-box" />}

      {error && !loading && <div className="alert alert-error">{error}</div>}

      {actionMessage ? (
        <div
          className={`alert ${actionMessage.type === "success" ? "alert-success" : "alert-error"}`}
        >
          {actionMessage.text}
        </div>
      ) : null}

      {data && !loading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={range}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label={`Total ${range}`} value={data.totals.range} />
              <StatCard label="Hari Ini" value={data.totals.today} />
              <StatCard label="7 Hari" value={data.totals.week} />
              <StatCard label="Bulan Ini" value={data.totals.month} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg text-primary">
                    Tren Kunjungan Harian
                  </h2>
                  <div className="h-64 md:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.chart}>
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#1F6F5F"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg text-primary">
                    Distribusi Keperluan
                  </h2>
                  <div className="h-64 md:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.purpose}
                          dataKey="total"
                          nameKey="purpose"
                          outerRadius={95}
                        >
                          {data.purpose.map((entry, index) => (
                            <Cell
                              key={entry.purpose}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            getPurposeLabel(name as VisitPurposeValue),
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-lg text-primary">
                  Data Kunjungan Terbaru
                </h2>
                <div className="overflow-x-auto">
                  <table className="table table-sm md:table-md">
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>Nama</th>
                        <th>Instansi</th>
                        <th>Keterangan</th>
                        <th>Keperluan</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.latestVisits.map((visit) => (
                        <tr key={visit.id}>
                          <td>{formatIdDateTime(new Date(visit.visitAt))}</td>
                          <td>
                            <div className="font-semibold">{visit.name}</div>
                            <div className="text-xs opacity-70">
                              {visit.phone}
                            </div>
                          </td>
                          <td>{visit.institutionOrigin}</td>
                          <td className="max-w-xs whitespace-normal text-xs opacity-80">
                            {visit.address}
                          </td>
                          <td>
                            {getPurposeLabel(visit.purpose)}
                            {visit.otherPurposeNote ? (
                              <div className="text-xs opacity-70">
                                {visit.otherPurposeNote}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-xs btn-primary btn-outline"
                                onClick={() => {
                                  setEditingVisit(visit);
                                  setDialogMode("edit");
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => {
                                  setPhotoError(null);
                                  setSelectedPhoto({
                                    id: visit.id,
                                    name: visit.name,
                                    visitAt: visit.visitAt,
                                  });
                                }}
                              >
                                Lihat
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-error btn-outline"
                                disabled={deletingId === visit.id}
                                onClick={() => void handleDeleteVisit(visit)}
                              >
                                {deletingId === visit.id
                                  ? "Menghapus..."
                                  : "Hapus"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {selectedPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              setSelectedPhoto(null);
              setPhotoError(null);
            }
          }}
          role="presentation"
        >
          <div
            className="w-full max-w-5xl rounded-box bg-base-100 p-4 shadow-2xl md:p-6"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-primary">
                  Foto Kunjungan
                </h3>
                <p className="text-sm opacity-70">
                  {selectedPhoto.name} •{" "}
                  {formatIdDateTime(new Date(selectedPhoto.visitAt))}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setSelectedPhoto(null);
                  setPhotoError(null);
                }}
              >
                Tutup
              </button>
            </div>

            <div className="mt-4 rounded-box bg-base-200 p-2 md:p-4">
              {photoError ? (
                <div className="alert alert-error">{photoError}</div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/admin/photo/${selectedPhoto.id}`}
                  alt={`Foto kunjungan ${selectedPhoto.name}`}
                  className="mx-auto max-h-[72vh] w-full rounded-lg object-contain"
                  onError={() => setPhotoError("Foto gagal dimuat")}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}

      {dialogMode !== null ? (
        <AdminVisitFormDialog
          key={`${dialogMode}-${editingVisit?.id ?? "new"}`}
          mode={dialogMode === "edit" ? "edit" : "create"}
          open
          initialValue={
            dialogMode === "edit" && editingVisit
              ? {
                  id: editingVisit.id,
                  name: editingVisit.name,
                  institutionOrigin: editingVisit.institutionOrigin,
                  address: editingVisit.address,
                  phone: editingVisit.phone,
                  purpose: editingVisit.purpose,
                  otherPurposeNote: editingVisit.otherPurposeNote ?? "",
                }
              : null
          }
          onClose={() => {
            setDialogMode(null);
            setEditingVisit(null);
          }}
          onSaved={async () => {
            await loadDashboard();
            setActionMessage({
              type: "success",
              text:
                dialogMode === "edit"
                  ? "Data kunjungan berhasil diperbarui"
                  : "Data kunjungan berhasil ditambahkan",
            });
          }}
        />
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-4">
        <p className="text-sm opacity-70">{label}</p>
        <p className="text-3xl font-semibold text-primary">{value}</p>
      </div>
    </div>
  );
}
