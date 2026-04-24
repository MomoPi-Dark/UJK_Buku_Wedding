# Sistem Buku Tamu Wedding

## Identitas Mahasiswa

- Nama: `Muhammad Iqbal Afnan`
- NIM: `220103099`
- Kelas: `TI22A3`

## Deskripsi Tema

Tema studi kasus pada proyek ini adalah **Sistem Buku Tamu Wedding**. Aplikasi digunakan untuk mencatat data kunjungan tamu wedding secara terstruktur, lengkap dengan autentikasi login admin dan fitur CRUD untuk mengelola data kunjungan.

Tema ini sengaja dipertahankan agar sesuai instruksi tugas tanpa mengganti kasus aplikasi yang sudah berjalan.

## Kesesuaian Dengan Instruksi Tugas

### 1. Analisis dan desain kasus

- Tema kasus: **Wedding Digital Guestbook / Buku Tamu Wedding**
- Aktor sistem:
  - `Admin`: login dan mengelola data buku tamu
  - `Tamu`: mengirim love note atau data kunjungan dari halaman publik
- Alur utama:
  - Tamu mengisi form buku tamu di halaman utama
  - Data tersimpan ke database
  - Admin login ke sistem
  - Admin melakukan CRUD data kunjungan dari dashboard

### 2. Desain database

Minimal instruksi meminta 2 tabel, dan proyek ini sudah memenuhi itu:

- `user`: tabel pengguna untuk autentikasi login
- `guest_visits`: tabel bisnis utama untuk data buku tamu wedding

Tabel pendukung autentikasi yang juga digunakan:

- `session`
- `account`
- `verification`

Tabel tambahan fitur interaksi:

- `guest_visit_reactions`

### 3. Fitur autentikasi login

- Halaman login tersedia di `/admin/login`
- Sistem autentikasi menggunakan **session-based authentication** melalui Better Auth
- Password disimpan dalam bentuk terenkripsi / ter-hash oleh Better Auth
- Halaman dan API admin diproteksi menggunakan session cookie

### 4. CRUD tabel bisnis

CRUD diterapkan pada tabel bisnis `guest_visits`:

- `Create`: tambah data kunjungan
- `Read`: tampilkan daftar data kunjungan
- `Update`: ubah data kunjungan
- `Delete`: hapus data kunjungan

Semua proses CRUD admin hanya bisa diakses setelah login.

### 5. UI dan framework

- Frontend: **Next.js + React**
- Backend API: **Next.js Route Handlers**
- ORM: **Prisma**
- Database: **MySQL**
- UI: komponen native React + utility CSS + DaisyUI

## Fitur Utama

- Login admin menggunakan Better Auth.
- Session-based authentication untuk melindungi halaman admin.
- Password terenkripsi.
- CRUD data pada tabel bisnis `guest_visits`.
- Prisma ORM + MySQL untuk pengelolaan database.
- Reaction system pada memory wall yang tersimpan di database.

## Struktur Tabel

- `user`: tabel pengguna untuk autentikasi login.
- `account`, `session`, `verification`: tabel pendukung Better Auth.
- `guest_visits`: tabel bisnis untuk data buku tamu.
- `guest_visit_reactions`: tabel reaksi untuk memory wall.

## Halaman Aplikasi

- `/`: halaman publik buku tamu wedding.
- `/admin/login`: halaman login admin.
- `/admin`: redirect ke dashboard admin setelah login.
- `/admin/dashboard/overview`: dashboard admin.
- `/admin/dashboard/users`: CRUD akun admin.

## Menjalankan Project

1. Install dependency:

```bash
pnpm install
```

2. Isi `.env` sesuai kebutuhan:

```env
DATABASE_URL=
GOOGLE_SCRIPT_UPLOAD_URL=
GOOGLE_SCRIPT_FILE_PROXY_URL=
GOOGLE_SCRIPT_TOKEN=
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
BETTER_AUTH_URL=
BETTER_AUTH_SECRET=
```

3. Generate Prisma client:

```bash
pnpm exec prisma generate
```

4. Jalankan migration:

```bash
pnpm exec prisma migrate deploy
```

5. Jalankan development server:

```bash
pnpm dev
```

## Catatan

- Ganti placeholder identitas mahasiswa sebelum dikumpulkan.
- Pastikan `BETTER_AUTH_URL` diisi, misalnya `http://localhost:3000`.
- `ADMIN_SESSION_SECRET` sebaiknya berupa string acak minimal 32 karakter.
- Akses CRUD admin dilindungi login, sehingga sudah sesuai syarat "halaman CRUD hanya boleh diakses setelah pengguna berhasil login".
