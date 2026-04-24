# Sistem Buku Tamu Wedding (EverAfter Notes)

## Identitas Mahasiswa

- **Nama**: `Muhammad Iqbal Afnan`
- **NIM**: `220103099`
- **Kelas**: `TI22A3`

## Deskripsi Tema

Tema studi kasus pada proyek ini adalah **Sistem Buku Tamu Wedding**. Aplikasi digunakan untuk mencatat data kunjungan tamu wedding secara terstruktur, lengkap dengan autentikasi login admin dan fitur CRUD untuk mengelola data kunjungan.

Tema ini sengaja dipertahankan agar sesuai instruksi tugas tanpa mengganti kasus aplikasi yang sudah berjalan.

## Kesesuaian Dengan Instruksi Tugas

### 1. Analisis dan Desain Kasus

- Tema kasus: **Wedding Digital Guestbook / Buku Tamu Wedding**
- Aktor sistem:
  - `Admin`: Melakukan login dan mengelola data buku tamu dari dashboard.
  - `Tamu`: Mengirim _love note_ atau data kunjungan dari halaman publik.
- Alur utama:
  - Tamu mengisi form buku tamu di halaman utama.
  - Data tersimpan ke database dan langsung tampil di _memory wall_.
  - Admin login ke sistem.
  - Admin melakukan CRUD (Create, Read, Update, Delete) data kunjungan dari dashboard.

### 2. Desain Database

Minimal instruksi meminta 2 tabel, dan proyek ini sudah memenuhi itu:

- `user`: Tabel pengguna untuk autentikasi login.
- `guest_visits`: Tabel bisnis utama untuk data buku tamu wedding.

Tabel pendukung autentikasi yang juga digunakan:

- `session`, `account`, `verification` (Tabel bawaan Better Auth).

Tabel tambahan fitur interaksi:

- `guest_visit_reactions`: Menyimpan data reaksi pada _love notes_.

### 3. Fitur Autentikasi Login

- Halaman login tersedia di `/admin/login`
- Sistem autentikasi menggunakan **session-based authentication** melalui Better Auth.
- Password disimpan dalam bentuk terenkripsi / ter-hash oleh Better Auth
- Halaman dan rute API admin diproteksi menggunakan session cookie.

### 4. CRUD Tabel Bisnis

CRUD diterapkan pada tabel bisnis `guest_visits`:

- `Create`: Tambah data kunjungan.
- `Read`: Tampilkan daftar data kunjungan di dashboard.
- `Update`: Ubah data kunjungan.
- `Delete`: Hapus data kunjungan.

_Catatan: Semua proses CRUD admin hanya bisa diakses setelah login berhasil._

### 5. UI dan Framework

- Frontend: **Next.js + React**
- Backend API: **Next.js Route Handlers**
- ORM: **Prisma**
- Database: **MySQL**
- UI: Komponen native React + Tailwind CSS + DaisyUI

## ✨ Fitur Utama

- 🔐 **Autentikasi Aman**: Login admin menggunakan session-based authentication dengan Better Auth (password terenkripsi).
- 📊 **Dashboard Admin**: Pengelolaan penuh (CRUD) data kunjungan pada tabel bisnis `guest_visits`.
- 🚀 **Tech Stack Modern**: Menggunakan Next.js App Router, Prisma ORM, dan MySQL.
- 💖 **Memory Wall & Reaksi**: Tamu dapat melihat ucapan secara _real-time_ dan memberikan reaksi pada _love notes_.
- 🎨 **UI Menarik**: Antarmuka responsif dan cantik dengan Tailwind CSS & DaisyUI.

## 🗺️ Struktur Halaman (Routing)

- `/` : Halaman publik buku tamu wedding (Form & Memory Wall).
- `/admin/login` : Halaman login admin.
- `/admin` : Redirect otomatis ke dashboard admin setelah login.
- `/admin/dashboard/overview` : Dashboard admin untuk kelola data buku tamu.
- `/admin/dashboard/users` : Halaman CRUD akun admin tambahan.

## 🚀 Menjalankan Project

### Prasyarat

- Node.js (versi 18+)
- PNPM package manager
- MySQL Database yang berjalan

### Langkah-langkah

1. **Install dependency**:

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
