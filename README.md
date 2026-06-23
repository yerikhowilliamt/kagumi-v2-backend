# Kagumi v2 Backend API Documentation

A progressive backend application built with **NestJS**, **Prisma ORM**, **Zod** (for request validation), and **PostgreSQL**. This system handles authentication, user profile management, categories, products, orders, order items with custom configurations, payments, and image asset uploads integrated with Cloudinary.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 atau lebih tinggi)
* **PostgreSQL** database (lokal atau cloud instance)
* Akun **Cloudinary** (untuk integrasi upload gambar)

### Project Setup
1. **Clone repository dan install dependency:**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment Variables (`.env`):**
   Buat file `.env` di direktori root project dengan nilai-nilai berikut:
   ```env
   PORT=4015
   DATABASE_URL="postgresql://username:password@localhost:5432/kagumi_v2?schema=public"

   # JWT Configuration
   JWT_ACCESS_SECRET="your-super-secret-jwt-access-key-here"
   JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-here"

   # Google OAuth Credentials
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_CALLBACK_URL="http://localhost:4003/api/auth/google/redirect"

   # Cryptography Configuration (untuk Enkripsi data sensitif)
   CRYPTO_ALGORITHM="aes-256-cbc"
   CRYPTO_SECRET_KEY="your-32-byte-hex-secret-key-here-32bytes" # Harus 32 bytes (64 hex characters)
   INITIAL_VECTOR="your-16-byte-hex-iv-here-16bytes" # Harus 16 bytes (32 hex characters)

   # Cloudinary Credentials (untuk Modul Image)
   CLOUDINARY_NAME="your-cloudinary-cloud-name"
   CLOUDINARY_API_KEY="your-cloudinary-api-key"
   CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
   ```

3. **Prisma Migrations & Client Generation:**
   Jalankan migrasi untuk menyiapkan skema database dan men-generate Prisma Client:
   ```bash
   npx prisma migrate dev
   ```

4. **Menjalankan Aplikasi:**
   ```bash
   # Mode Development (dengan Auto-Reload)
   npm run start:dev

   # Mode Production
   npm run build
   # lalu
   npm run start:prod
   ```

---

## 📁 Project Architecture & Folder Structure

Aplikasi backend ini mengikuti pola modular yang direkomendasikan NestJS:

```text
src/
├── common/                  # Shared configurations, guards, filters, middlewares
│   ├── cloudinary/          # Cloudinary client & upload helper service
│   ├── interceptors/        # Global logging & interceptor responses
│   ├── logger/              # LoggerService wrapper menggunakan winston
│   ├── middleware/          # AuthMiddleware untuk validasi session token
│   └── validation/          # Custom Zod validation decorators & pipes
├── helpers/                 # Utility services (response, tokens, crypto)
│   ├── response/            # Standardized WebResponse service
│   ├── token/               # JWT token creation, verification & refresh
│   └── crypto/              # Password hashing & encryption
├── models/                  # TypeScript interface global (misalnya WebResponse)
├── modules/                 # App Feature Modules (Modul bisnis utama)
│   ├── auth/                # Registrasi, Login, Google OAuth, Refresh Token, Logout
│   ├── category/            # Hirarki Kategori (Induk & Subkategori)
│   ├── custom-order-option/ # Kustomisasi opsi order per produk
│   ├── image/               # Pengelolaan upload & hapus gambar produk ke Cloudinary
│   ├── order/               # Manajemen Order & validasi stock transaksi
│   ├── order-item/          # Detail item di dalam Order
│   ├── payment/             # Pencatatan transaksi & unggah bukti bayar
│   ├── product/             # Manajemen katalog produk (Regular, Daily, Custom)
│   └── user/                # Profile management & role access control (ADMIN, USER)
```

---

## 🔒 Konvensi & Standar Kode (Bagi Junior / AI Agent)

### 1. Format Response Terstandardisasi (`WebResponse`)
Seluruh controller wajib mengembalikan response menggunakan `ResponseService.success()` dengan skema model berikut:
```json
{
  "success": true,
  "message": "Subject action successfully",
  "status": 200,
  "data": { ... },
  "timestamp": "2026-06-23T10:00:00.000Z"
}
```
Jika terjadi error (misalnya validation, bad request, unauthorized), filter global secara otomatis mengubah error tersebut menjadi response terstruktur dengan `success: false`.

### 2. Validasi Input Payload Menggunakan Zod
Validasi body request divalidasi secara deklaratif menggunakan library `nestjs-zod` lewat decorator `@ZodBody()`.
* Buat skema Zod di dalam berkas file `*.validation.ts` di masing-masing modul.
* Buat DTO di dalam folder `dto/` dengan menggunakan `createZodDto(Schema)`.

### 3. Keamanan & Role-Based Access Control (RBAC)
* Gunakan `@UseGuards(JwtAccessAuthGuard)` untuk membatasi endpoint agar hanya dapat diakses oleh user yang telah login (terotentikasi via JWT Cookie / Header).
* Gunakan gabungan `@UseGuards(RoleGuard)` dan `@Roles('ADMIN')` untuk membatasi aksi yang hanya boleh dilakukan oleh Administrator (seperti membuat kategori, produk baru, atau mengelola media).

### 4. Transaksi & Pencegahan Race Condition Stok
Saat menangani pengurangan stok produk (misalnya saat checkout order atau pembatalan order):
* Gunakan Prisma Transaction (`this.prismaService.$transaction`).
* **Wajib** menggunakan *Atomic Update* guna menghindari race condition (tidak mengambil data ke memori terlebih dahulu lalu menyimpannya kembali). Contoh:
  ```typescript
  await tx.product.updateMany({
    where: { id: productId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } }
  });
  ```

---

## 📡 API Reference & Endpoints Detail

Untuk dokumentasi visual dan interaktif, Anda dapat mengakses **Swagger UI** saat aplikasi berjalan di alamat: `http://localhost:4015/api/docs`

Berikut adalah detail spesifikasi teknis endpoint per modul:

### 🔑 1. Authentication (`/api/auth`)
Modul untuk mendaftarkan akun baru, melakukan login tradisional, otentikasi Google, memperbarui JWT, dan keluar dari sistem.

* **`POST /api/auth/register`**
  * **Akses:** Publik
  * **Payload (JSON):**
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "password": "SecretPassword123"
    }
    ```
* **`POST /api/auth/login`**
  * **Akses:** Publik
  * **Payload (JSON):**
    ```json
    {
      "email": "jane@example.com",
      "password": "SecretPassword123"
    }
    ```
  * **Respon:** Mengembalikan token JWT dan secara otomatis menyematkan cookie HttpOnly `access_token` dan `refresh_token` di browser.
* **`POST /api/auth/refresh`**
  * **Akses:** Publik (mengirimkan cookie `refresh_token`)
  * **Respon:** Memperbarui validitas `access_token`.
* **`DELETE /api/auth/logout`**
  * **Akses:** Terotentikasi
  * **Respon:** Menghapus data token di database dan membersihkan JWT cookie.

---

### 👤 2. Users (`/api/users`)
Mengelola data akun pengguna yang aktif.

* **`GET /api/users/current`**
  * **Akses:** Terotentikasi (`USER` / `ADMIN`)
  * **Respon:** Detail profil pengguna aktif (nama, email, no HP, alamat, role, image_url).
* **`PATCH /api/users/current/profile`**
  * **Akses:** Terotentikasi (`USER` / `ADMIN`)
  * **Payload (JSON):** Nama, no HP, alamat, atau image_url opsional.
* **`PATCH /api/users/current/password`**
  * **Akses:** Terotentikasi (`USER` / `ADMIN`)
  * **Payload (JSON):** `oldPassword` dan `newPassword`.
* **`GET /api/users`**
  * **Akses:** Hanya `ADMIN`
  * **Respon:** Daftar seluruh pengguna sistem.

---

### 📁 3. Categories (`/api/categories`)
Mengelola pengelompokan produk secara hirarkis (parent-child category).

* **`POST /api/categories`**
  * **Akses:** Hanya `ADMIN`
  * **Payload (JSON):** `name`, `description`, `parentId` (opsional jika subkategori).
* **`GET /api/categories`**
  * **Akses:** Publik
* **`GET /api/categories/:id`**
  * **Akses:** Publik
* **`PATCH /api/categories/:id`**
  * **Akses:** Hanya `ADMIN`
  * **Payload (JSON):** Bidang yang ingin diupdate.
* **`DELETE /api/categories/:id`**
  * **Akses:** Hanya `ADMIN`
  * **Aturan:** Penghapusan ditolak jika kategori masih memiliki produk aktif atau subkategori di bawahnya.

---

### 🏷️ 4. Products (`/api/products`)
Mengelola katalog produk (Regular, Daily Bake, Custom).

* **`POST /api/products`**
  * **Akses:** Hanya `ADMIN`
  * **Payload (JSON):**
    ```json
    {
      "name": "Kue Chocolate Fudge",
      "description": "Kue cokelat premium lembut",
      "price": 150000.00,
      "type": "REGULAR", // atau "DAILY_BAKE" / "CUSTOM"
      "stock": 20,
      "categoryId": 3
    }
    ```
* **`GET /api/products`**
  * **Akses:** Publik
* **`GET /api/products/:id`**
  * **Akses:** Publik
* **`PATCH /api/products/:id`**
  * **Akses:** Hanya `ADMIN`
* **`DELETE /api/products/:id`**
  * **Akses:** Hanya `ADMIN`

---

### 🖼️ 5. Images (`/api/images`)
Mengelola unggahan (upload) asset gambar produk. Terintegrasi secara langsung dengan **Cloudinary**.

* **`POST /api/images`**
  * **Akses:** Hanya `ADMIN`
  * **Content-Type:** `multipart/form-data`
  * **Payload (Form Data):**
    * `productId` (number): ID produk yang diasosiasikan dengan gambar ini. (Wajib diisi, divalidasi via Zod).
    * `image` (file, max 1): File gambar tunggal untuk diunggah.
    * `images` (file[]): Beberapa file gambar sekaligus untuk diunggah secara batch.
    * *Catatan:* Wajib menyertakan minimal 1 file gambar baik di field `image` maupun `images`.
  * **Respon:** Mengembalikan data gambar yang tersimpan di database beserta Cloudinary `public_id` dan `secure_url`.
* **`GET /api/images`**
  * **Akses:** Terotentikasi (`USER` / `ADMIN`)
  * **Respon:** Menampilkan daftar semua gambar produk di database.
* **`GET /api/images/:id`**
  * **Akses:** Terotentikasi (`USER` / `ADMIN`)
* **`PATCH /api/images/:id`**
  * **Akses:** Hanya `ADMIN`
  * **Deskripsi:** Mengganti berkas gambar yang ada.
  * **Format Parameter `:id`:** Bisa berupa satu ID angka (misal `/api/images/12`) atau beberapa ID dipisah koma (misal `/api/images/12,13`).
  * **Content-Type:** `multipart/form-data`
  * **Aturan:** Jumlah ID yang dikirimkan pada parameter URL harus sama persis dengan jumlah file gambar baru yang dikirimkan pada payload multipart.
  * **Mekanisme Belakang:** Service akan menghapus gambar lama di Cloudinary berdasarkan `publicId` terlebih dahulu sebelum mengupload gambar baru dan mengupdate record database.
* **`DELETE /api/images/:id`**
  * **Akses:** Hanya `ADMIN`
  * **Format Parameter `:id`:** Satu ID angka atau beberapa ID dipisah koma (misal `/api/images/12,13`).
  * **Mekanisme Belakang:** Menghapus asset dari penyimpanan awan Cloudinary menggunakan API destroy, kemudian menghapus record gambar tersebut dari database secara permanen.

---

### 📦 6. Orders (`/api/orders`)
Memproses pembuatan, pelacakan, dan pembatalan pesanan barang.

* **`POST /api/orders`**
  * **Akses:** Hanya `USER`
  * **Payload (JSON):**
    ```json
    {
      "deliveryMethod": "DELIVERY", // atau "COD"
      "paymentMethod": "TRANSFER", // atau "E_WALLET"
      "items": [
        {
          "productId": 1,
          "quantity": 2,
          "note": "Minta lilin ulang tahun"
        }
      ]
    }
    ```
  * **Mekanisme Belakang:** Melakukan pengecekan stok dengan kunci transaksi. Mengurangi stok produk secara aman. Mengembalikan detail order berserta total harga kalkulasi otomatis.
* **`GET /api/orders`**
  * **Akses:** Terotentikasi (`ADMIN` dapat melihat seluruh order, `USER` hanya dapat melihat order miliknya sendiri).
* **`GET /api/orders/:id`**
  * **Akses:** Pemilik order atau `ADMIN`
* **`PATCH /api/orders/:id`**
  * **Akses:** Terotentikasi
    * `ADMIN`: Dapat mengubah status order (`PAID`, `PROCESSING`, `DELIVERING`, `COMPLETED`, `CANCELED`) dan metode pengiriman.
    * `USER`: Hanya diperbolehkan mengubah status menjadi `CANCELED` jika status saat ini masih `PENDING`. Pembatalan oleh USER akan secara otomatis memicu pemulihan (*restore*) stok produk yang sebelumnya dipesan.
* **`DELETE /api/orders/:id`**
  * **Akses:** Hanya `ADMIN` (melakukan hard-delete data order).

---

### 📦 7. Order Items (`/api/order-items`)
Mengelola data detail item spesifik dari sebuah pesanan.

* **`POST /api/order-items`**
  * **Akses:** Terotentikasi (`USER` / `ADMIN`)
  * **Payload:** Menambahkan item baru ke order yang sudah ada. Dapat menyertakan unggahan gambar desain custom via field `image`.
  * **Efek Samping:** Secara otomatis menghitung ulang nominal `totalPrice` pada entitas parent `Order`.
* **`GET /api/order-items`**
  * **Akses:** Pemilik order / `ADMIN`
* **`GET /api/order-items/:id`**
  * **Akses:** Pemilik order / `ADMIN`
* **`PATCH /api/order-items/:id`**
  * **Akses:** Hanya `ADMIN` (Mengubah jumlah item atau detail kustomisasi). Memicu kalkulasi ulang total harga pesanan.
* **`DELETE /api/order-items/:id`**
  * **Akses:** Hanya `ADMIN`. Memicu kalkulasi ulang total harga pesanan.

---

### 💳 8. Payments (`/api/payments`)
Mengelola pembayaran untuk pesanan.

* **`POST /api/payments`**
  * **Akses:** Pemilik order / `ADMIN`
  * **Payload (Multipart atau JSON):** Mengirimkan `orderId`, `amount`, `paymentMethod`, serta opsional bukti pembayaran (`paymentProof`) berupa file gambar.
* **`GET /api/payments`**
  * **Akses:** Pemilik pembayaran / `ADMIN`
* **`GET /api/payments/:id`**
  * **Akses:** Pemilik pembayaran / `ADMIN`
* **`PATCH /api/payments/:id`**
  * **Akses:** Hanya `ADMIN` (Mengubah status pembayaran seperti `SETTLEMENT` atau `FAILED`).
* **`DELETE /api/payments/:id`**
  * **Akses:** Hanya `ADMIN`

---

### ⚙️ 9. Custom Order Options (`/api/custom-orders`)
Menyediakan konfigurasi input tambahan yang harus diisi pelanggan ketika memesan produk bertipe `CUSTOM` (contoh: "Teks pada kue", "Warna dekorasi").

* **`POST /api/custom-orders`**
  * **Akses:** Hanya `ADMIN`
  * **Payload (JSON):** `productId`, `label` (Nama input), `placeholder` (Contoh teks), dan `required` (Boolean).
* **`GET /api/custom-orders`**
  * **Akses:** Publik
* **`GET /api/custom-orders/:id`**
  * **Akses:** Publik
* **`PATCH /api/custom-orders/:id`**
  * **Akses:** Hanya `ADMIN`
* **`DELETE /api/custom-orders/:id`**
  * **Akses:** Hanya `ADMIN`

---

## 🧪 Testing

Project ini dilengkapi dengan test suite lengkap untuk menjaga kualitas kode dan alur bisnis.

```bash
# Menjalankan seluruh Unit Test (menggunakan mock)
npm run test

# Menjalankan Integration / End-to-End (E2E) Test (menggunakan database bayangan/test)
npm run test:e2e

# Menghitung cakupan coverage pengujian
npm run test:cov
```

---

## 📮 Manual API Testing (REST Client)

Tersedia file konfigurasi `.http` untuk melakukan pengujian endpoint secara cepat menggunakan ekstensi **REST Client** di VS Code. Anda bisa melihat skenario request yang sudah di-prep pada tautan berikut:

* 🔑 [http/auth.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/auth.http) - Alur Registrasi, Login, Google Auth, & Logout.
* 👤 [http/user.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/user.http) - Profiling & pergantian Password.
* 📁 [http/categories.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/categories.http) - CRUD Kategori barang.
* 🏷️ [http/products.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/products.http) - Katalog produk & set stok.
* 🖼️ [http/images.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/images.http) - Uji coba upload multipart image produk & Cloudinary.
* 📦 [http/orders.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/orders.http) - Skenario checkout order & penanganan stock.
* 📦 [http/order-items.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/order-items.http) - Penambahan & manipulasi item pesanan.
* 💳 [http/payments.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/payments.http) - Simulasi status bayar & bukti transfer.
* ⚙️ [http/custom-orders.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/custom-orders.http) - Pengaturan parameter order kustom.

