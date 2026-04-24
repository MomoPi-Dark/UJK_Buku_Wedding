"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminDashboardShell } from "@/components/admin/admin-dashboard-shell";
import { AdminUserFormDialog } from "@/components/admin/admin-user-form-dialog";
import { formatIdDateTime } from "@/lib/time";

const ACTION_MESSAGE_DURATION_MS = 10_000;

type AdminUserData = {
  id: string;
  name: string;
  email: string;
  username: string;
  isDefaultAdmin: boolean;
  createdAt: string;
};

export function AdminUsersDashboard() {
  const [adminUserDialogOpen, setAdminUserDialogOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUserData[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState<string | null>(null);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadAdminUsers = useCallback(async () => {
    setAdminUsersLoading(true);
    setAdminUsersError(null);
    try {
      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });
      const json = (await response.json()) as {
        ok?: boolean;
        data?: { users?: AdminUserData[] };
        error?: { message?: string };
      };

      if (!response.ok || !json.ok || !json.data?.users) {
        throw new Error(json.error?.message ?? "Gagal memuat data admin");
      }

      setAdminUsers(json.data.users);
    } catch (err) {
      setAdminUsersError(
        err instanceof Error ? err.message : "Gagal memuat data admin",
      );
    } finally {
      setAdminUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAdminUsers();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadAdminUsers]);

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

  async function handleDeleteAdmin(user: AdminUserData) {
    if (user.isDefaultAdmin) {
      setActionMessage({
        type: "error",
        text: "Admin utama tidak boleh dihapus",
      });
      return;
    }

    const confirmed = window.confirm(
      `Hapus akun admin ${user.email}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingAdminId(user.id);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message ?? "Gagal menghapus akun admin");
      }

      setActionMessage({
        type: "success",
        text: `Akun admin ${user.email} berhasil dihapus`,
      });

      await loadAdminUsers();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menghapus akun admin",
      });
    } finally {
      setDeletingAdminId(null);
    }
  }

  return (
    <AdminDashboardShell
      activeSection="users"
      rightAction={
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setAdminUserDialogOpen(true)}
        >
          Tambah Admin
        </button>
      }
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="card-title text-lg text-primary">Users</h2>
              <p className="text-sm opacity-70">
                Kelola akun admin yang punya akses ke dashboard.
              </p>
            </div>
          </div>

          {adminUsersLoading ? (
            <div className="skeleton h-48 w-full rounded-box" />
          ) : null}

          {!adminUsersLoading && adminUsersError ? (
            <div className="alert alert-error">{adminUsersError}</div>
          ) : null}

          {!adminUsersLoading && !adminUsersError ? (
            <div className="overflow-x-auto">
              <table className="table table-sm md:table-md">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Dibuat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.length > 0 ? (
                    adminUsers.map((user) => {
                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {user.username}
                              </span>
                              {user.isDefaultAdmin ? (
                                <span className="badge badge-primary badge-outline badge-sm">
                                  utama
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{formatIdDateTime(new Date(user.createdAt))}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-xs btn-error btn-outline"
                              disabled={
                                user.isDefaultAdmin ||
                                deletingAdminId === user.id
                              }
                              onClick={() => void handleDeleteAdmin(user)}
                            >
                              {deletingAdminId === user.id
                                ? "Menghapus..."
                                : "Hapus"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center opacity-70">
                        Belum ada akun admin tambahan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      <AdminUserFormDialog
        key={adminUserDialogOpen ? "admin-user-open" : "admin-user-closed"}
        open={adminUserDialogOpen}
        onClose={() => setAdminUserDialogOpen(false)}
        onSaved={async () => {
          await loadAdminUsers();
          setActionMessage({
            type: "success",
            text: "Akun admin baru berhasil ditambahkan",
          });
        }}
      />
    </AdminDashboardShell>
  );
}
