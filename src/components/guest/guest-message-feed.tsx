"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageCard,
  ReactionType,
  WallMessage,
} from "@/components/guest/message-card";

type FeedResponse = {
  ok: boolean;
  data?: {
    messages: WallMessage[];
  };
  error?: {
    message?: string;
  };
};

type ReactionResponse = {
  ok: boolean;
  data?: {
    messageId: number;
    reactions: Record<ReactionType, number>;
    viewerReactions: Record<ReactionType, boolean>;
  };
  error?: {
    message?: string;
  };
};

const POLL_INTERVAL_MS = 25_000;
const REACTOR_ID_STORAGE_KEY = "guestbook-reactor-id";

export function GuestMessageFeed() {
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactorId, setReactorId] = useState<string>("");
  const [pendingReaction, setPendingReaction] = useState<
    Record<number, ReactionType | null>
  >({});
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      setError(null);
      try {
        const query = new URLSearchParams({ limit: "18" });
        if (reactorId) {
          query.set("reactorId", reactorId);
        }
        const response = await fetch(`/api/wall?${query.toString()}`, {
          cache: "no-store",
        });
        const json = (await response.json()) as FeedResponse;

        if (!response.ok || !json.ok || !json.data) {
          throw new Error(json.error?.message ?? "Gagal memuat pesan tamu");
        }

        setMessages(json.data.messages);
        setLastUpdated(new Date().toISOString());
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Gagal memuat pesan tamu",
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [reactorId],
  );

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(REACTOR_ID_STORAGE_KEY)
        : null;
    const nextReactorId =
      stored && stored.length >= 8 ? stored : crypto.randomUUID();

    if (typeof window !== "undefined" && stored !== nextReactorId) {
      window.localStorage.setItem(REACTOR_ID_STORAGE_KEY, nextReactorId);
    }

    setReactorId(nextReactorId);
  }, []);

  useEffect(() => {
    if (!reactorId) {
      return;
    }

    const bootId = window.setTimeout(() => {
      void loadMessages();
    }, 0);

    const intervalId = window.setInterval(() => {
      void loadMessages(true);
    }, POLL_INTERVAL_MS);

    const onPosted = () => {
      void loadMessages(true);
    };

    window.addEventListener("guestbook:posted", onPosted);

    return () => {
      window.clearTimeout(bootId);
      window.clearInterval(intervalId);
      window.removeEventListener("guestbook:posted", onPosted);
    };
  }, [loadMessages, reactorId]);

  const highlightedMessage = useMemo(() => {
    return messages.find((item) => item.highlighted) ?? messages[0] ?? null;
  }, [messages]);

  const regularMessages = useMemo(() => {
    if (!highlightedMessage) {
      return messages;
    }

    return messages.filter((item) => item.id !== highlightedMessage.id);
  }, [messages, highlightedMessage]);

  async function handleReact(messageId: number, reaction: ReactionType) {
    if (!reactorId) {
      return;
    }

    setPendingReaction((prev) => ({
      ...prev,
      [messageId]: reaction,
    }));

    try {
      const response = await fetch("/api/wall/reactions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          reaction,
          reactorId,
        }),
      });
      const json = (await response.json()) as ReactionResponse;

      if (!response.ok || !json.ok || !json.data) {
        throw new Error(json.error?.message ?? "Gagal mengirim reaksi");
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === json.data?.messageId
            ? {
                ...message,
                reactions: json.data.reactions,
                viewerReactions: json.data.viewerReactions,
              }
            : message,
        ),
      );
    } catch (reactionError) {
      setError(
        reactionError instanceof Error
          ? reactionError.message
          : "Gagal mengirim reaksi",
      );
    } finally {
      setPendingReaction((prev) => ({
        ...prev,
        [messageId]: null,
      }));
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-primary/15 bg-base-100/70 p-4 shadow-lg backdrop-blur-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-primary">
            Dinding Catatan Harapan
          </h2>
          <p className="text-sm opacity-75">
            Setiap ucapan tampil sebagai memori hidup dari hari bahagia
            mempelai.
          </p>
        </div>
        <span className="badge badge-outline badge-primary">
          Update: {formatUpdatedLabel(lastUpdated)}
        </span>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="skeleton h-44 rounded-2xl" />
          <div className="skeleton h-44 rounded-2xl" />
        </div>
      ) : null}

      {error ? <div className="alert alert-error">{error}</div> : null}

      {!loading && !error && messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/20 p-6 text-center text-sm opacity-75">
          Belum ada surat. Jadilah tamu pertama yang meninggalkan doa terbaik.
        </div>
      ) : null}

      {!loading && !error && highlightedMessage ? (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-primary/70">
            Highlighted Blessing
          </p>
          <MessageCard
            message={highlightedMessage}
            onReact={handleReact}
            reacting={pendingReaction[highlightedMessage.id] ?? null}
          />
        </div>
      ) : null}

      {!loading && !error && regularMessages.length > 0 ? (
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 items-start auto-rows-fr"
          >
            {regularMessages.map((item) => (
              <MessageCard
                key={item.id}
                message={item}
                onReact={handleReact}
                reacting={pendingReaction[item.id] ?? null}
                dense
              />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : null}
    </section>
  );
}

function formatUpdatedLabel(iso: string): string {
  if (!iso) {
    return "menunggu";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}
