"use client";

import { motion } from "framer-motion";

export type ReactionType = "heart" | "bouquet" | "sparkle";

export type WallMessage = {
  id: number;
  author: string;
  message: string;
  origin: string;
  category: string;
  visitAt: string;
  highlighted: boolean;
  reactions: Record<ReactionType, number>;
};

type MessageCardProps = {
  message: WallMessage;
  reactionTotals: Record<ReactionType, number>;
  onReact: (messageId: number, reaction: ReactionType) => void;
  dense?: boolean;
};

const REACTION_META: Record<ReactionType, { icon: string; label: string }> = {
  heart: { icon: "❤️", label: "Love" },
  bouquet: { icon: "💐", label: "Blessing" },
  sparkle: { icon: "✨", label: "Beautiful" },
};

export function MessageCard({
  message,
  reactionTotals,
  onReact,
  dense = false,
}: MessageCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, rotate: dense ? 0 : -0.35 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`memory-note relative overflow-hidden rounded-[1.65rem] border border-primary/14 bg-[linear-gradient(180deg,rgba(255,251,248,0.95),rgba(249,241,235,0.9))] p-4 shadow-[0_18px_45px_rgba(94,63,75,0.1)] ${
        message.highlighted ? "ring-2 ring-accent/30" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-[linear-gradient(180deg,rgba(183,110,121,0.06),transparent)]" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-20 w-20 rounded-full bg-accent/18 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-10 w-full bg-[radial-gradient(circle_at_left_bottom,rgba(216,167,184,0.08),transparent_45%)]" />

      <div className="flex items-start justify-between gap-3">
        <div className="relative z-10">
          <p className="font-heading text-2xl leading-none text-primary">
            {message.author}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] opacity-65">
            {message.origin}
          </p>
        </div>

        <div className="relative z-10 text-right">
          {message.highlighted ? (
            <span className="rounded-full border border-accent/25 bg-accent/12 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-accent-content">
              most treasured
            </span>
          ) : null}
          <p className="mt-2 text-xs opacity-65">
            {formatRelativeTime(message.visitAt)}
          </p>
        </div>
      </div>

      <p
        className={`relative z-10 mt-4 whitespace-pre-wrap leading-7 text-foreground/82 ${dense ? "text-sm" : "text-[15px]"}`}
      >
        {message.message}
      </p>

      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-primary/12 bg-base-100/68 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-primary/72">
          {message.category}
        </span>
        <div className="flex items-center gap-1">
          {(Object.keys(REACTION_META) as ReactionType[]).map((reaction) => (
            <button
              key={reaction}
              type="button"
              className="btn btn-ghost btn-xs gap-1 rounded-full border border-primary/10 bg-base-100/72 px-2.5"
              onClick={() => onReact(message.id, reaction)}
              aria-label={REACTION_META[reaction].label}
            >
              <span>{REACTION_META[reaction].icon}</span>
              <span>{reactionTotals[reaction]}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMinutes = Math.floor((now - date.getTime()) / 60_000);

  if (diffMinutes < 1) {
    return "baru saja";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} hari lalu`;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(date);
}
