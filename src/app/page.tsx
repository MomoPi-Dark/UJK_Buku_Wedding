import { GuestMessageFeed } from "../components/guest-message-feed";
import { GuestbookForm } from "@/components/guestbook-form";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-base-200">
      <div className="pointer-events-none absolute inset-0 bg-orbit" />
      <div className="absolute inset-0 bg-grid opacity-50" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-base-100/80 px-4 py-3 backdrop-blur-sm md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary/70">
              Wedding Digital Guestbook
            </p>
            <p className="text-lg font-semibold text-primary md:text-xl">
              EverAfter Notes
            </p>
          </div>
          <a href="/admin/login" className="btn btn-sm btn-outline btn-primary">
            Admin Memory Studio
          </a>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[1.05fr_1fr]">
          <section className="glass-panel card border border-primary/20 text-base-content shadow-xl xl:sticky xl:top-6">
            <div className="card-body gap-5 p-6 md:p-8">
              <p className="badge badge-accent badge-outline w-fit">
                The Wedding of
              </p>
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                <span className="font-accent block text-4xl text-secondary md:text-5xl">
                  Alya &amp; Raka
                </span>
                Love Notes Memory Wall
              </h1>
              <p className="text-sm font-medium tracking-wide text-primary/80">
                Sabtu, 21 Juni 2026 • Jakarta
              </p>
              <p className="max-w-2xl text-sm opacity-80 md:text-base">
                Terima kasih sudah hadir di hari istimewa kami. Tinggalkan doa,
                ucapan, dan kenangan agar momen ini tetap hidup sepanjang waktu.
              </p>

              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div className="rounded-xl border border-primary/10 bg-base-100/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-primary/60">
                    Love Notes
                  </p>
                  <p className="text-xl font-semibold text-primary">Live</p>
                  <p className="opacity-80">Ucapan tamu tampil real-time</p>
                </div>
                <div className="rounded-xl border border-primary/10 bg-base-100/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-primary/60">
                    Blessings
                  </p>
                  <p className="text-xl font-semibold text-primary">
                    Highlight
                  </p>
                  <p className="opacity-80">Doa terhangat ditampilkan khusus</p>
                </div>
                <div className="rounded-xl border border-primary/10 bg-base-100/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-primary/60">
                    Memories
                  </p>
                  <p className="text-xl font-semibold text-primary">Timeless</p>
                  <p className="opacity-80">Setiap pesan tersimpan abadi</p>
                </div>
              </div>

              <p className="text-sm opacity-75">
                Tuliskan love note Anda di panel kanan. Setelah terkirim, ucapan
                akan langsung muncul di memory wall pernikahan.
              </p>
            </div>
          </section>

          <GuestbookForm />
        </div>

        <section className="pt-8">
          <GuestMessageFeed />
        </section>
      </div>
    </main>
  );
}
