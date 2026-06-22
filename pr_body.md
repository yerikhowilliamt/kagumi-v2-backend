## Deskripsi Perubahan

Pull Request ini mencakup dua perubahan utama:
1. **Swagger API Documentation:**
   - Instalasi `@nestjs/swagger` dan `swagger-ui-express`.
   - Mengonfigurasi `nestjs-zod` v5 `cleanupOpenApiDoc` pada `src/main.ts` agar secara otomatis membuat dokumentasi API dan schema validasi (diakses melalui `/api/docs`).
   - Menambahkan anotasi `@ApiTags()` di semua Controller untuk mengelompokkan API sesuai dengan fiturnya.
2. **Fix Race Condition pada Pengurangan Stok:**
   - Memperbaiki celah pada `order.service.ts` dan `order-item.service.ts` di mana stok produk berkurang menjadi angka negatif jika ada order bersamaan.
   - Mengubah proses pengurangan stok agar menggunakan _Optimistic Atomic Update_ dari Prisma, yaitu dengan `tx.product.updateMany` dan klausa `stock: { gte: quantity }`.
   - Update `order` & `order-item` test suite (`updateMany` mocks).

## Checklist
- [x] Swagger UI dapat diakses via `/api/docs`
- [x] Unit test baru/yang diupdate (155 tests) sudah berhasil lulus (`npm run test` PASS)
- [x] Transaksi stok sudah aman dari *race condition* (Atomic operation)

## Bukti Test
```bash
Test Suites: 28 passed, 28 total
Tests:       155 passed, 155 total
Snapshots:   0 total
```
