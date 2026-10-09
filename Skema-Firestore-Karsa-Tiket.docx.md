**Skema Firestore Karsa Tiket**

Daftar koleksi dan *field* yang dibuat di Cloud Firestore untuk Karsa Tiket (Tiketing Event) · Tugas Mandiri Sesi 3

# **1\. Gambaran Umum**

Karsa Tiket memakai tiga koleksi. Nama koleksi dan *field* di dokumen ini dipakai apa adanya. Usulan nama berbeda dari agen AI wajib diperiksa dulu.

| Koleksi | Isi | ID dokumen |
| :---- | :---- | :---- |
| event | Acara, harga tiket, kuota, dan tiket terjual | Otomatis |
| pembeli | Nama, nomor WhatsApp, dan email | Nomor WhatsApp |
| tiket | Pembelian, total bayar, dan status kehadiran | Otomatis |

Hubungan antarkoleksi:

| pembeli (1) ──── (banyak) tiket (banyak) ──── (1) event |
| :---- |

Satu pembeli dapat memiliki banyak tiket. Satu event dapat memiliki banyak tiket. Satu dokumen tiket hanya untuk satu event.

Rekap tidak memakai koleksi sendiri. Rekap dihitung dari koleksi event dan tiket.

# **2\. Aturan Penulisan**

| Aturan | Contoh |
| :---- | :---- |
| Nama koleksi huruf kecil, bentuk tunggal | event, pembeli, tiket |
| Nama *field* huruf kecil dengan garis bawah | nama\_pembeli, harga\_tiket |
| Uang disimpan sebagai angka bulat rupiah, tanpa titik | 25000, bukan "25.000" |
| Tanggal disimpan sebagai teks | "2026-10-01" |
| Waktu pembuatan diisi oleh server Firestore | serverTimestamp() |
| Nilai status ditulis huruf kecil dengan garis bawah | menunggu\_bayar |

# **3\. Koleksi event**

Menyimpan setiap acara yang menjual tiket. ID dokumen dibuat otomatis oleh Firestore.

| Field | Tipe | Wajib | Keterangan |
| :---- | :---- | :---- | :---- |
| nama | string | Ya | Nama acara, 1 sampai 60 karakter |
| tanggal | string | Ya | Tanggal acara, format YYYY-MM-DD |
| lokasi | string | Ya | Tempat acara, 1 sampai 100 karakter |
| harga\_tiket | number (bulat) | Ya | Harga satu tiket, minimal 0\. Nilai 0 berarti gratis |
| kuota | number (bulat) | Ya | Jumlah kursi, 1 sampai 500 |
| tiket\_terjual | number (bulat) | Ya | Minimal 0 dan tidak melebihi kuota. Nilai awal 0 |
| dibuat\_pada | timestamp | Ya | Waktu dokumen dibuat |

## **Contoh dokumen event/Ev27dKm**

| {   "nama": "Workshop Sablon Tote Bag",   "tanggal": "2026-10-18",   "lokasi": "Ruang Karsa, Jl. Merdeka No. 21",   "harga\_tiket": 75000,   "kuota": 30,   "tiket\_terjual": 2,   "dibuat\_pada": 1 Oktober 2026 08.00 } |
| :---- |

Sisa kuota tidak disimpan. Sisa kuota dihitung di aplikasi: kuota dikurangi tiket\_terjual.

# **4\. Koleksi pembeli**

Menyimpan data pembeli tiket. ID dokumen memakai nomor WhatsApp, sehingga satu nomor hanya dapat dipakai satu pembeli.

| Field | Tipe | Wajib | Keterangan |
| :---- | :---- | :---- | :---- |
| nama | string | Ya | Nama pembeli, 1 sampai 60 karakter |
| no\_whatsapp | string | Ya | Sama dengan ID dokumen. Diawali 08, total 10 sampai 13 angka |
| email | string | Ya | Mengandung tanda @, maksimal 80 karakter |
| dibuat\_pada | timestamp | Ya | Waktu dokumen dibuat |

## **Contoh dokumen pembeli/081355512345**

| {   "nama": "Nadia Putri",   "no\_whatsapp": "081355512345",   "email": "nadia.putri@contoh.id",   "dibuat\_pada": 1 Oktober 2026 08.30 } |
| :---- |

Sebelum menyimpan pembeli baru, periksa dokumen dengan getDoc. Jika sudah ada, tampilkan "Nomor WhatsApp sudah terdaftar".

# **5\. Koleksi tiket**

Menyimpan setiap pembelian tiket. ID dokumen dibuat otomatis. Satu dokumen tiket bisa berisi 1 sampai 5 tiket untuk satu event.

| Field | Tipe | Wajib | Keterangan |
| :---- | :---- | :---- | :---- |
| event\_id | string | Ya | ID dokumen event |
| nama\_event | string | Ya | Salinan nama event saat tiket dibuat |
| tanggal\_event | string | Ya | Salinan tanggal event, format YYYY-MM-DD |
| pembeli\_id | string | Ya | ID dokumen pembeli (nomor WhatsApp) |
| nama\_pembeli | string | Ya | Salinan nama pembeli saat tiket dibuat |
| harga\_tiket | number (bulat) | Ya | Salinan harga event saat tiket dibuat |
| jumlah\_tiket | number (bulat) | Ya | 1 sampai 5 dan tidak melebihi sisa kuota |
| total | number (bulat) | Ya | harga\_tiket × jumlah\_tiket |
| status | string | Ya | Salah satu nilai pada tabel status |
| dibuat\_pada | timestamp | Ya | Waktu dokumen dibuat |

## **Nilai field status**

| Nilai | Arti | Boleh berubah ke |
| :---- | :---- | :---- |
| menunggu\_bayar | Tiket dicatat, pembayaran belum dicek | lunas atau dibatalkan |
| lunas | Pembayaran sudah diterima | hadir |
| hadir | Pembeli sudah *check-in* di acara | Tidak ada |
| dibatalkan | Pembelian batal, kuota dikembalikan | Tidak ada |

Data baru selalu dimulai dari menunggu\_bayar. Status tidak boleh melompat atau mundur.

## **Contoh dokumen tiket/Tk63fHs**

| {   "event\_id": "Ev27dKm",   "nama\_event": "Workshop Sablon Tote Bag",   "tanggal\_event": "2026-10-18",   "pembeli\_id": "081355512345",   "nama\_pembeli": "Nadia Putri",   "harga\_tiket": 75000,   "jumlah\_tiket": 2,   "total": 150000,   "status": "menunggu\_bayar",   "dibuat\_pada": 1 Oktober 2026 09.15 } |
| :---- |

Perhitungan total: 75.000 × 2 \= 150.000.

Setelah tiket tersimpan, aplikasi menambah tiket\_terjual pada event dengan increment(jumlah\_tiket). Saat tiket dibatalkan, aplikasi mengurangi dengan increment(-jumlah\_tiket).

## **Mengapa nama dan harga disalin?**

Jika harga berubah besok, transaksi hari ini tetap menyimpan harga saat transaksi dibuat. Laporan hari sebelumnya tidak ikut berubah.

# **6\. Tiga Aturan Nilai**

Tiga aturan ini harus selalu benar pada data. Aturan ini dijaga oleh formulir dan *security rules*.

| No | Aturan | Koleksi |
| :---- | :---- | :---- |
| 1 | harga\_tiket tidak pernah negatif dan tiket\_terjual tidak pernah melebihi kuota | event |
| 2 | jumlah\_tiket selalu 1 sampai 5 dan tidak melebihi sisa kuota | tiket |
| 3 | total selalu sama dengan harga\_tiket × jumlah\_tiket | tiket |

# **7\. Aturan yang Dijaga Security Rules**

Tulis *security rules* sendiri berdasarkan tabel ini. Gunakan contoh rules Dapur Nia dari kelas sebagai pola.

| Koleksi | Yang wajib ditolak bila tidak terpenuhi |
| :---- | :---- |
| event | Nama dan lokasi wajib. Tanggal berformat YYYY-MM-DD. Harga angka bulat minimal 0\. Kuota 1 sampai 500\. Tiket terjual minimal 0 dan tidak melebihi kuota. |
| pembeli | Nama wajib. No WhatsApp sama dengan ID dokumen dan diawali 08\. Email mengandung @. |
| tiket | Jumlah angka bulat 1 sampai 5 dan tidak melebihi sisa kuota. Harga sama dengan harga event. Total sesuai rumus. Status awal menunggu\_bayar. Status hanya berpindah sesuai tabel. |

# **8\. Arti Tipe Data**

| Tipe | Arti | Contoh |
| :---- | :---- | :---- |
| string | Teks | "Karsa Tiket" |
| number | Angka | 25000 |
| boolean | Pilihan ya atau tidak | true / false |
| timestamp | Tanggal dan jam | 1 Oktober 2026 08.00 |

