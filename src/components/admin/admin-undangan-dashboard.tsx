"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminDashboardShell } from "@/components/admin/admin-dashboard-shell";
import {
  AdminUndanganFormDialog,
  type UndanganFormValue,
} from "@/components/admin/admin-undangan-form-dialog";
import { formatIdDateTime } from "@/lib/time";

const ACTION_MESSAGE_DURATION_MS = 10_000;

type ManagementUndanganItem = {
  id: string;
  fileId: string;
  fileName: string;
  folderPath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

export function AdminUndanganDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<ManagementUndanganItem | null>(
    null,
  );
  const [items, setItems] = useState<ManagementUndanganItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<{
    id: string;
    fileName: string;
  } | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/management-undangan", {
        cache: "no-store",
      });
      const json = (await response.json()) as {
        ok?: boolean;
        data?: { items?: ManagementUndanganItem[] };
        error?: { message?: string };
      };

      if (!response.ok || !json.ok || !json.data?.items) {
        throw new Error(
          json.error?.message ?? "Gagal memuat data management undangan",
        );
      }

      setItems(json.data.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data management undangan",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadItems]);

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

  async function handleDelete(item: ManagementUndanganItem) {
    const confirmed = window.confirm(`Hapus data undangan ${item.fileName}?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setActionMessage(null);

    try {
      const response = await fetch(
        `/api/admin/management-undangan/${item.id}`,
        {
          method: "DELETE",
        },
      );
      const json = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !json.ok) {
        throw new Error(
          json.error?.message ?? "Gagal menghapus data management undangan",
        );
      }

      setActionMessage({
        type: "success",
        text: `Data ${item.fileName} berhasil dihapus`,
      });
      await loadItems();
    } catch (err) {
      setActionMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Gagal menghapus data management undangan",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const dialogInitialValue: UndanganFormValue | null = editingItem
    ? {
        id: editingItem.id,
        fileId: editingItem.fileId,
        fileName: editingItem.fileName,
        folderPath: editingItem.folderPath,
        mimeType: editingItem.mimeType,
        sizeBytes: String(editingItem.sizeBytes),
        uploadedAt: toDateTimeLocalValue(editingItem.uploadedAt),
      }
    : null;

  return (
    <AdminDashboardShell
      activeSection="undangan"
      // rightAction={
      //   <button
      //     type="button"
      //     className="btn btn-primary btn-sm"
      //     onClick={() => {
      //       setDialogMode("create");
      //       setEditingItem(null);
      //       setDialogOpen(true);
      //     }}
      //   >
      //     Tambah Data Undangan
      //   </button>
      // }
    >
      {actionMessage ? (
        <div
          className={`alert ${actionMessage.type === "success" ? "alert-success" : "alert-error"}`}
        >
          {actionMessage.text}
        </div>
      ) : null}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body gap-3">
          <div>
            <h2 className="card-title text-lg text-primary">
              Management Undangan
            </h2>
            <p className="text-sm opacity-70">
              Kelola metadata file undangan (file id, path, mime type, dan
              ukuran).
            </p>
          </div>

          {loading ? (
            <div className="skeleton h-48 w-full rounded-box" />
          ) : null}

          {!loading && error ? (
            <div className="alert alert-error">{error}</div>
          ) : null}

          {!loading && !error ? (
            <div className="overflow-x-auto">
              <table className="table table-sm md:table-md">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Nama File</th>
                    <th>File ID</th>
                    <th>Folder Path</th>
                    <th>Uploaded</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.mimeType.startsWith("image/") ? (
                            <button
                              type="button"
                              className="btn btn-ghost h-16 w-16 overflow-hidden rounded-box p-0"
                              onClick={() =>
                                setSelectedPreview({
                                  id: item.id,
                                  fileName: item.fileName,
                                })
                              }
                              aria-label={`Lihat gambar ${item.fileName}`}
                            >
                              <img
                                src={`/api/admin/management-undangan/${item.id}/photo`}
                                alt={item.fileName}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          ) : (
                            <span className="badge badge-ghost">
                              Bukan gambar
                            </span>
                          )}
                        </td>
                        <td className="font-semibold">{item.fileName}</td>
                        <td className="max-w-56 truncate">{item.fileId}</td>
                        <td className="max-w-64 truncate">{item.folderPath}</td>
                        <td>{formatIdDateTime(new Date(item.uploadedAt))}</td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn btn-xs btn-primary btn-outline"
                              onClick={() => {
                                setDialogMode("edit");
                                setEditingItem(item);
                                setDialogOpen(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-error btn-outline"
                              disabled={deletingId === item.id}
                              onClick={() => void handleDelete(item)}
                            >
                              {deletingId === item.id
                                ? "Menghapus..."
                                : "Hapus"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center opacity-70">
                        Belum ada data management undangan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      {selectedPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              setSelectedPreview(null);
            }
          }}
          role="presentation"
        >
          <div className="w-full max-w-5xl rounded-box bg-base-100 p-3 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3 px-2">
              <p className="truncate text-sm font-medium">
                {selectedPreview.fileName}
              </p>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setSelectedPreview(null)}
              >
                Tutup
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-box bg-base-200 p-2">
              <img
                src={`/api/admin/management-undangan/${selectedPreview.id}/photo`}
                alt={selectedPreview.fileName}
                className="mx-auto max-h-[70vh] w-auto max-w-full rounded-box object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      <AdminUndanganFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValue={dialogInitialValue}
        onClose={() => setDialogOpen(false)}
        onSaved={async () => {
          await loadItems();
          setActionMessage({
            type: "success",
            text:
              dialogMode === "create"
                ? "Data undangan berhasil ditambahkan"
                : "Data undangan berhasil diperbarui",
          });
        }}
      />
    </AdminDashboardShell>
  );
}

function toDateTimeLocalValue(input: string): string {
  const date = new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
