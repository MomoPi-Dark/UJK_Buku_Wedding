"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { AdminVisitFormDialog } from "@/components/admin/admin-visit-form-dialog";
import { AdminDashboardShell } from "@/components/admin/admin-dashboard-shell";
import { getPurposeLabel } from "@/lib/guestbook";
import { formatIdDateTime } from "@/lib/time";
import type { VisitPurposeValue } from "@/lib/guestbook";
import type {
  ReactionType,
  WallMessage,
} from "@/components/guest/message-card";

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
    relation: string;
    address: string;
    purpose: VisitPurposeValue;
    otherPurposeNote: string | null;
    photoFolderPath: string;
    visitAt: string;
    reactions: Record<ReactionType, number>;
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

const ACTION_MESSAGE_DURATION_MS = 5000; // Hilang otomatis dalam 5 detik

export function AdminOverviewDashboard() {
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
  const [editingVisit, setEditingVisit] = useState<
    DashboardData["latestVisits"][number] | null
  >(null);

  const wallMessages = useMemo(
    () =>
      data?.latestVisits.map((visit, index) => toWallMessage(visit, index)) ??
      [],
    [data],
  );

  const highlightedMessage = useMemo(
    () => wallMessages.find((message) => message.highlighted) ?? null,
    [wallMessages],
  );

  const reactionSummary = useMemo(() => {
    return wallMessages.reduce(
      (accumulator, message) => {
        accumulator.heart += message.reactions.heart;
        accumulator.bouquet += message.reactions.bouquet;
        accumulator.sparkle += message.reactions.sparkle;
        return accumulator;
      },
      { heart: 0, bouquet: 0, sparkle: 0 },
    );
  }, [wallMessages]);

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

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActionMessage(null);
    }, ACTION_MESSAGE_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actionMessage]);

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
    <AdminDashboardShell
      activeSection="overview"
      rightAction={
        <div className="join">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`btn join-item btn-sm ${range === option.value ? "btn-primary" : "btn-outline"}`}
              onClick={() => setRange(option.value)}
              disabled={loading}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      {loading && !data ? (
        <div className="skeleton h-96 w-full rounded-box" />
      ) : null}

      {error && !loading ? (
        <div className="alert alert-error">{error}</div>
      ) : null}

      {actionMessage ? (
        <div
          className={`alert ${actionMessage.type === "success" ? "alert-success" : "alert-error"}`}
        >
          {actionMessage.text}
        </div>
      ) : null}

      {data ? (
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
              <StatCard
                label={`Total Ucapan (${RANGE_OPTIONS.find((opt) => opt.value === range)?.label})`}
                value={data.totals.range}
              />
              <StatCard label="Hari Ini" value={data.totals.today} />
              <StatCard label="7 Hari" value={data.totals.week} />
              <StatCard label="Bulan Ini" value={data.totals.month} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg text-primary">
                    Tren Ucapan & Doa Harian
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
                    Distribusi Kategori Memory Wall
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
                  Daftar Kunjungan Terbaru
                </h2>
                <div className="overflow-x-auto">
                  <table className="table table-sm md:table-md">
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>Penulis</th>
                        <th>Pesan</th>
                        <th>Asal</th>
                        <th>Kategori</th>
                        <th>Reaksi</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.latestVisits.map((visit) => (
                        <tr key={visit.id}>
                          <td>{formatIdDateTime(new Date(visit.visitAt))}</td>
                          <td>
                            <div className="font-semibold">{visit.name}</div>
                          </td>
                          <td className="max-w-sm whitespace-normal text-xs opacity-80">
                            {visit.address}
                          </td>
                          <td>{visit.relation}</td>
                          <td>
                            <div>{getPurposeLabel(visit.purpose)}</div>
                            {visit.otherPurposeNote ? (
                              <div className="text-xs opacity-70">
                                {visit.otherPurposeNote}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1 text-xs">
                              <span className="badge badge-ghost badge-sm">
                                ❤️ {visit.reactions.heart}
                              </span>
                              <span className="badge badge-ghost badge-sm">
                                💐 {visit.reactions.bouquet}
                              </span>
                              <span className="badge badge-ghost badge-sm">
                                ✨ {visit.reactions.sparkle}
                              </span>
                            </div>
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
      ) : null}

      {highlightedMessage ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="card-title text-lg text-primary">
                  Highlight Home Page
                </h2>
                <p className="text-sm opacity-70">
                  Pesan paling atas dari wall yang tampil di home page.
                </p>
              </div>
              <span className="badge badge-outline badge-primary">
                {highlightedMessage.category}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <StatCard label="❤️ Hearts" value={reactionSummary.heart} />
              <StatCard label="💐 Bouquets" value={reactionSummary.bouquet} />
              <StatCard label="✨ Sparkles" value={reactionSummary.sparkle} />
              <StatCard label="Highlight" value={1} />
            </div>
          </div>
        </div>
      ) : null}

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
                  Foto Bukti Undangan: {selectedPhoto.name}
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
                  alt={`Foto Bukti Undangan ${selectedPhoto.name}`}
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
                  relation: editingVisit.relation,
                  address: editingVisit.address,
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
    </AdminDashboardShell>
  );
}

function toWallMessage(
  visit: DashboardData["latestVisits"][number],
  index: number,
): WallMessage {
  return {
    id: visit.id,
    author: visit.name,
    message: visit.address,
    origin: visit.relation,
    category: getPurposeLabel(visit.purpose),
    visitAt: visit.visitAt,
    highlighted: index === 0,
    reactions: visit.reactions,
    viewerReactions: {
      heart: false,
      bouquet: false,
      sparkle: false,
    },
  };
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
