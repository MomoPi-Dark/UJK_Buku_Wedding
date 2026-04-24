# Google Apps Script Setup (Upload + File Proxy)

Dokumen ini untuk membuat:

- `GOOGLE_SCRIPT_UPLOAD_URL`
- `GOOGLE_SCRIPT_FILE_PROXY_URL`
- `GOOGLE_SCRIPT_TOKEN`

sesuai backend di project ini.

> Penting: versi `upload.gs` di repo ini sudah support `action: "delete"` untuk fitur hapus data dari panel admin (foto Drive ikut terhapus/di-trash).

## 1) Buat folder root di Google Drive

1. Buka Google Drive.
2. Buat folder baru, mis. `MAN2_BukuTamu`.
3. Buka folder itu, ambil ID folder dari URL.

Contoh URL:

```txt
https://drive.google.com/drive/folders/1AbCDefGhIjKlMnOp
```

ID folder = `1AbCDefGhIjKlMnOp`

Simpan ID ini, nanti dipakai sebagai `BOOK_GUEST_ROOT_FOLDER_ID`.

## 2) Buat token rahasia

Di terminal lokal, jalankan:

```bash
openssl rand -base64 48
```

Hasilnya jadi nilai `GOOGLE_SCRIPT_TOKEN` dan juga `BOOK_GUEST_TOKEN` di Apps Script.

## 3) Buat Apps Script untuk upload

1. Buka https://script.google.com
2. Klik **New Project**.
3. Ganti nama project mis. `MAN2 Upload Endpoint`.
4. Hapus isi `Code.gs`, lalu paste isi file `docs/google-apps-script/upload.gs`.
5. Buka **Project Settings** (ikon gear).
6. Masuk ke **Script properties**, tambahkan:
   - `BOOK_GUEST_TOKEN` = token dari langkah 2
   - `BOOK_GUEST_ROOT_FOLDER_ID` = folder ID dari langkah 1

### Deploy Web App (Upload)

1. Klik **Deploy** -> **New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Klik **Deploy**.
6. Copy URL web app -> ini jadi `GOOGLE_SCRIPT_UPLOAD_URL`.

Catatan penting:

- Gunakan URL yang berakhiran `/exec`.
- Jangan pakai URL test deployment `/dev` karena akan gagal (umumnya 401) saat dipanggil dari server Next.js.

## 4) Buat Apps Script untuk file proxy

1. Buat project baru lagi di Apps Script.
2. Nama mis. `MAN2 File Proxy Endpoint`.
3. Paste isi `docs/google-apps-script/file-proxy.gs` ke `Code.gs`.
4. Tambahkan Script property:
   - `BOOK_GUEST_TOKEN` = token yang sama dari langkah 2

### Deploy Web App (File Proxy)

1. Klik **Deploy** -> **New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Klik **Deploy**.
6. Copy URL web app -> ini jadi `GOOGLE_SCRIPT_FILE_PROXY_URL`.

Catatan penting:

- Gunakan URL yang berakhiran `/exec`.
- Jangan pakai URL test deployment `/dev`.

## 5) Isi .env project Next.js

Edit `.env` project ini:

```env
GOOGLE_SCRIPT_UPLOAD_URL="https://script.google.com/macros/s/xxx/exec"
GOOGLE_SCRIPT_FILE_PROXY_URL="https://script.google.com/macros/s/yyy/exec"
GOOGLE_SCRIPT_TOKEN="token_random_panjang"
```

Pastikan ketiga nilai ini sinkron dengan script properties di Apps Script.

## 6) Test endpoint upload (opsional tapi disarankan)

Contoh test curl minimal (ganti URL, token, dan base64):

```bash
curl -X POST "$GOOGLE_SCRIPT_UPLOAD_URL" \
  -H 'content-type: application/json' \
  -d '{
    "token":"YOUR_TOKEN",
    "name":"Intan",
    "purpose":"Informasi PMB",
    "mimeType":"image/jpeg",
    "extension":"jpg",
    "base64Data":"/9j/4AAQSkZJRg...",
    "visitAt":"2026-04-21T10:10:00+07:00"
  }'
```

Jika sukses, response berisi `ok: true` dan data `fileId`, `fileName`, `folderPath`.

## 6b) Test endpoint delete foto (wajib untuk panel admin)

Contoh test:

```bash
curl -X POST "$GOOGLE_SCRIPT_UPLOAD_URL" \
  -H 'content-type: application/json' \
  -d '{
    "token":"YOUR_TOKEN",
    "action":"delete",
    "fileId":"GOOGLE_DRIVE_FILE_ID"
  }'
```

Jika sukses, response berisi `ok: true` dan `deleted: true`.
Kalau muncul error `INVALID_ACTION` / `Unsupported action`, berarti script lama belum di-update, paste ulang `docs/google-apps-script/upload.gs` lalu deploy ulang web app `/exec`.

## 7) Struktur folder otomatis yang dihasilkan

Script upload akan membuat folder:

- `YYYY`
- `MM-BulanIndonesia`
- `YYYY-MM-DD`

Contoh:

```txt
2026/04-April/2026-04-21/
```

Nama file:

```txt
2026-04-21_14-37-09_nama-keperluan.jpg
```

Semua berbasis timezone `Asia/Jakarta`.

## 8) Catatan keamanan penting

- Token wajib rahasia dan panjang.
- Jangan commit `.env` ke git.
- Jangan share URL + token ke publik.
- File di Drive tetap private karena script dijalankan sebagai akun kamu (`Execute as: Me`) dan app Next.js hanya akses file via proxy endpoint + token.
