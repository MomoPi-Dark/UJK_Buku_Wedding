"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageCard,
  ReactionType,
  WallMessage,
} from "@/components/message-card";

type FeedResponse = {
  ok: boolean;
  data?: {
    messages: WallMessage[];
  };
  error?: {
    message?: string;
  };
};

type ReactionBoost = Record<number, Record<ReactionType, number>>;

const POLL_INTERVAL_MS = 25_000;

export function GuestMessageFeed() {
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactionBoost, setReactionBoost] = useState<ReactionBoost>({});
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    setError(null);
    try {
      const response = await fetch("/api/wall?limit=18", { cache: "no-store" });
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
  }, []);

  useEffect(() => {
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
  }, [loadMessages]);

  const highlightedMessage = useMemo(() => {
    return messages.find((item) => item.highlighted) ?? messages[0] ?? null;
  }, [messages]);

  const regularMessages = useMemo(() => {
    if (!highlightedMessage) {
      return messages;
    }

    return messages.filter((item) => item.id !== highlightedMessage.id);
  }, [messages, highlightedMessage]);

  function getReactionTotals(
    message: WallMessage,
  ): Record<ReactionType, number> {
    const boost = reactionBoost[message.id];
    return {
      heart: message.reactions.heart + (boost?.heart ?? 0),
      bouquet: message.reactions.bouquet + (boost?.bouquet ?? 0),
      sparkle: message.reactions.sparkle + (boost?.sparkle ?? 0),
    };
  }

  function handleReact(messageId: number, reaction: ReactionType) {
    setReactionBoost((prev) => {
      const current = prev[messageId] ?? { heart: 0, bouquet: 0, sparkle: 0 };
      return {
        ...prev,
        [messageId]: {
          ...current,
          [reaction]: current[reaction] + 1,
        },
      };
    });
  }

  return (
    <section className="space-y-4 rounded-3xl border border-primary/15 bg-base-100/70 p-4 shadow-lg backdrop-blur-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-primary">
            Love Notes Wall
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
          Belum ada love note. Jadilah tamu pertama yang meninggalkan doa
          terbaik.
        </div>
      ) : null}

      {!loading && !error && highlightedMessage ? (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-primary/70">
            Highlighted Blessing
          </p>
          <MessageCard
            message={highlightedMessage}
            reactionTotals={getReactionTotals(highlightedMessage)}
            onReact={handleReact}
          />
        </div>
      ) : null}

      {!loading && !error && regularMessages.length > 0 ? (
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          >
            {regularMessages.map((item) => (
              <MessageCard
                key={item.id}
                message={item}
                reactionTotals={getReactionTotals(item)}
                onReact={handleReact}
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
