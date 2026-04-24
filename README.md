# Sistem Buku Tamu Wedding

## Identitas Mahasiswa

- Nama: `ISI_NAMA_MAHASISWA`
- NIM: `ISI_NIM`
- Kelas: `ISI_KELAS`

## Deskripsi Tema

Tema studi kasus pada proyek ini adalah **Sistem Buku Tamu Wedding**. Aplikasi digunakan untuk mencatat data kunjungan tamu wedding secara terstruktur, lengkap dengan autentikasi login admin dan fitur CRUD untuk mengelola data kunjungan.

## Fitur Utama

- Login admin menggunakan Better Auth.
- Session-based authentication untuk melindungi halaman admin.
- Password terenkripsi.
- CRUD data pada tabel bisnis `guest_visits`.
- Prisma ORM + MySQL untuk pengelolaan database.

## Struktur Tabel

- `user`: tabel pengguna untuk autentikasi login.
- `account`, `session`, `verification`: tabel pendukung Better Auth.
- `guest_visits`: tabel bisnis untuk data buku tamu.

## Halaman Aplikasi

- `/`: landing page studi kasus.
- `/admin/login`: halaman login admin.
- `/admin`: halaman CRUD data kunjungan, hanya bisa diakses setelah login.

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

## File Database Export

File SQL export tersedia di:

- `database_export.sql`

## Catatan

- Ganti placeholder identitas mahasiswa sebelum dikumpulkan.
- Pastikan `BETTER_AUTH_URL` diisi, misalnya `http://localhost:3000`.
- `ADMIN_SESSION_SECRET` sebaiknya berupa string acak minimal 32 karakter.
