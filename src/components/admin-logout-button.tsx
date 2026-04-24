"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      await authClient.signOut();
    } finally {
      router.replace("/admin/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button className="btn btn-sm btn-outline" type="button" onClick={() => void handleLogout()} disabled={loading}>
      {loading ? "Keluar..." : "Logout"}
    </button>
  );
}
