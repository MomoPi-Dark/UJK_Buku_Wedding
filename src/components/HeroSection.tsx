"use client";

import { motion } from "framer-motion";

const HERO_QUOTES = [
  "Every blessing becomes part of our story.",
  "A note from you will stay with us long after the music fades.",
  "Thank you for bringing your love to our happiest day.",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(140deg,rgba(255,252,249,0.92),rgba(255,244,240,0.78),rgba(248,239,230,0.9))] px-5 py-6 shadow-[0_30px_80px_rgba(94,63,75,0.12)] backdrop-blur md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[40%] bg-[radial-gradient(circle_at_center,rgba(208,171,135,0.18),transparent_68%)] lg:block" />
      <div className="pointer-events-none absolute -left-10 top-6 h-32 w-32 rounded-full bg-secondary/18 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-8 h-28 w-28 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-primary/65">
            <span className="rounded-full border border-primary/15 bg-base-100/70 px-3 py-1">
              Wedding Digital Guestbook
            </span>
            <span>Saturday, 21 June 2026</span>
          </div>

          <div className="space-y-2">
            <p className="font-accent text-4xl text-secondary md:text-5xl">
              The Wedding Of
            </p>
            <h1 className="font-heading text-5xl leading-none text-primary md:text-7xl">
              Alya <span className="px-1 text-secondary">&amp;</span> Raka
            </h1>
            <p className="max-w-2xl text-base leading-7 text-foreground/78 md:text-lg">
              Welcome to our wedding memory space. Leave a blessing, a little
              prayer, or a love note that will live here as part of our day.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="#write-note"
              className="btn btn-primary h-12 rounded-full px-6 text-base shadow-sm"
            >
              Leave Your Blessing
            </a>
            <a
              href="#memory-feed"
              className="btn btn-ghost h-12 rounded-full border border-primary/15 bg-base-100/55 px-6 text-base"
            >
              See the Memory Wall
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
          className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1"
        >
          {HERO_QUOTES.map((quote, index) => (
            <div
              key={quote}
              className={`rounded-[1.6rem] border px-4 py-5 shadow-sm backdrop-blur ${
                index === 1
                  ? "border-accent/30 bg-base-100/82"
                  : "border-primary/12 bg-base-100/62"
              }`}
            >
              <p className="font-accent text-3xl text-secondary/85">“</p>
              <p className="mt-1 text-sm leading-6 text-foreground/78">
                {quote}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
