**PRD: Karsa Tiket (Tiketing Event)**

Product Requirements Document · Tugas Mandiri Sesi 3

# **1\. Ringkasan Eksekutif**

Karsa Tiket adalah layanan tiket milik komunitas kreatif yang dikelola Laras. Komunitas rutin mengadakan workshop dan konser kecil. Pembelian tiket masuk lewat pesan pribadi dan dicatat di spreadsheet. Tiket pernah terjual melebihi kapasitas ruangan, status pembayaran tidak jelas, total dihitung manual, dan pembelian nol tiket tetap tercatat. Aplikasi dibangun untuk mengelola event, pembeli, tiket, pembayaran, kehadiran, dan rekap penjualan dalam satu alur data.

Pada tugas mandiri ini, aplikasi dibangun dalam konteks satu peran untuk latihan CRUD. Pemisahan hak penyelenggara, panitia, dan pembeli belum diterapkan.

| Keterangan | Isian |
| :---- | :---- |
| Nama aplikasi | Karsa Tiket (Tiketing Event) |
| Status | Tugas mandiri Sesi 3 |
| Basis data | Cloud Firestore |
| Platform publikasi | Netlify |
| Dokumen pendamping | Skema-Firestore-Karsa-Tiket.docx |

## **Masalah yang Diselesaikan**

| No | Masalah | Akibat |
| :---- | :---- | :---- |
| 1 | Penjualan tiket tidak dibatasi kuota | Peserta melebihi kapasitas ruangan. |
| 2 | Status pembayaran tidak jelas | Panitia tidak tahu siapa yang sudah lunas saat hari acara. |
| 3 | Total dihitung manual | Uang masuk tidak cocok dengan jumlah tiket terjual. |
| 4 | Pembelian nol tiket tetap tercatat | Data penjualan tidak sah masuk ke rekap. |

# **2\. Pengguna dan Peran**

Usaha ini memiliki tiga peran. Tugas mandiri menyederhanakan akses menjadi satu peran agar peserta fokus pada CRUD dan aturan data.

| Peran | Kewenangan | Status pada tugas |
| :---- | :---- | :---- |
| Penyelenggara · Laras | Seluruh fitur dan rekap | Digabung ke satu peran latihan |
| Panitia · Andi | Mencatat pembelian, konfirmasi bayar, dan *check-in* | Digabung ke satu peran latihan |
| Pembeli · Umum | Membeli tiket dan datang ke acara, tidak membuka aplikasi | Tidak memakai aplikasi |

# **3\. Lingkup Produk**

Aplikasi web responsif untuk layar telepon genggam. Pengguna membuka aplikasi melalui peramban dan mengelola data melalui UI CRUD.

## **3.1 Modul**

| Modul | Menu | Tujuan |
| :---- | :---- | :---- |
| Event | Daftar dan formulir event | Mengelola nama, tanggal, lokasi, harga tiket, dan kuota. |
| Pembeli | Daftar, pencarian, dan formulir pembeli | Mengelola nama, nomor WhatsApp, dan email. |
| Tiket | Daftar, detail, formulir, dan ubah status | Mencatat pembelian, total bayar, pelunasan, dan kehadiran. |
| Rekap | Ringkasan per event | Membaca tiket terjual, sisa kuota, pendapatan, dan jumlah hadir. |

## **3.2 Fitur v1**

| Termasuk | Tidak termasuk |
| :---- | :---- |
| CRUD event, pembeli, dan tiket; validasi; batas kuota; alur status; rekap per event | Pembelian mandiri oleh pembeli; pembayaran daring; kode QR; kursi bernomor |

# **4\. Alur Penggunaan**

Alur ini menggambarkan cara usaha berjalan dengan aplikasi. Setiap langkah menjadi dasar *acceptance criteria* pada Bagian 5\.

1. **Penyelenggara** membuat event: nama, tanggal, lokasi, harga tiket, dan kuota. Tiket terjual awal 0\.

2. **Pembeli** menghubungi panitia. **Panitia** mencari pembeli berdasarkan nomor WhatsApp. Bila belum terdaftar, panitia menambah data pembeli baru.

3. **Panitia** membuat tiket: memilih event, memilih pembeli, mengisi jumlah tiket 1 sampai 5\. Jumlah tidak boleh melebihi sisa kuota. Aplikasi menghitung total dan menambah tiket terjual pada event. Status awal menunggu\_bayar.

4. Setelah transfer dicek, **panitia** mengubah status menjadi lunas.

5. Pada hari acara, **panitia** mencari tiket pembeli dan mengubah status menjadi hadir (*check-in*).

6. Jika pembeli batal sebelum membayar, **panitia** mengubah status menjadi dibatalkan. Aplikasi mengurangi tiket terjual sehingga kuota kembali.

7. **Penyelenggara** membuka rekap untuk melihat tiket terjual, sisa kuota, pendapatan, dan jumlah peserta hadir per event.

Alur status pada koleksi tiket:

| Status | Arti | Boleh berubah ke |
| :---- | :---- | :---- |
| menunggu\_bayar | Tiket dicatat, pembayaran belum dicek | lunas atau dibatalkan |
| lunas | Pembayaran sudah diterima | hadir |
| hadir | Pembeli sudah *check-in* di acara | Tidak ada |
| dibatalkan | Pembelian batal, kuota dikembalikan | Tidak ada |

Data baru selalu dimulai dari menunggu\_bayar. Status tidak boleh melompat atau mundur.

# **5\. Kebutuhan Fungsional**

Nama koleksi dan *field* pada bagian ini mengikuti Skema-Firestore-Karsa-Tiket. Setiap *acceptance criteria* menjadi bahan uji pada tahap pengujian.

## **5.1 Modul Event**

Pengguna melihat daftar event beserta tanggal, lokasi, harga, kuota, dan sisa kuota.

**User story:** Sebagai penyelenggara, saya ingin menambah, melihat, mengubah, dan menghapus event, sehingga informasi acara dan kuota selalu benar.

### **Komponen UI**

| Komponen | Fungsi |
| :---- | :---- |
| Kartu event | Menampilkan acara beserta sisa kuota dan label Habis |
| Formulir dengan pemilih tanggal | Menambah dan mengubah event |
| Dialog konfirmasi | Memastikan sebelum menghapus |
| Toast | Memberi tahu data tersimpan atau terhapus |

### **Operasi Firestore · koleksi event**

| Operasi | Perintah |
| :---- | :---- |
| Create | addDoc(collection(db, "event"), {...}) |
| Read | getDocs(query(collection(db, "event"), orderBy("tanggal"), limit(20))) |
| Update | updateDoc(doc(db, "event", id), {...}) |
| Delete | deleteDoc(doc(db, "event", id)) |

### **Acceptance criteria**

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given nama, tanggal, lokasi, harga, dan kuota terisi dengan sah, When pengguna menekan Simpan Event, Then satu dokumen event tersimpan dengan tiket\_terjual bernilai 0\. |
| 2 | Given belum ada event, When daftar dibuka, Then aplikasi menampilkan *empty state* "Belum ada event" dengan tombol Tambah Event. |
| 3 | Given tiket terjual sama dengan kuota, When daftar dibuka, Then event tampil dengan label Habis. |
| 4 | Given kuota diubah menjadi lebih kecil dari tiket terjual, When data dikirim, Then permintaan ditolak. |
| 5 | Given harga negatif atau kuota 0, When data dikirim, Then permintaan ditolak dan data tidak berubah. |

## **5.2 Modul Pembeli**

Pengguna melihat dan mencari data pembeli berdasarkan nama atau nomor WhatsApp.

**User story:** Sebagai panitia, saya ingin mengelola data pembeli, sehingga setiap tiket dapat dikonfirmasi ke orang yang tepat.

### **Komponen UI**

| Komponen | Fungsi |
| :---- | :---- |
| Kolom cari | Menyaring daftar berdasarkan nama atau nomor |
| Tabel atau daftar | Menampilkan pembeli |
| Formulir | Menambah dan mengubah pembeli |
| Dialog konfirmasi | Memastikan sebelum menghapus |

### **Operasi Firestore · koleksi pembeli**

| Operasi | Perintah |
| :---- | :---- |
| Create | getDoc lalu setDoc(doc(db, "pembeli", noWhatsapp), {...}) |
| Read | getDocs(query(collection(db, "pembeli"), orderBy("nama"), limit(20))) |
| Update | updateDoc(doc(db, "pembeli", noWhatsapp), {...}) |
| Delete | deleteDoc(doc(db, "pembeli", noWhatsapp)) |

### **Acceptance criteria**

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given nama, nomor WhatsApp, dan email terisi, When pengguna menekan Simpan Pembeli, Then data pembeli tersimpan. |
| 2 | Given nomor WhatsApp sudah terdaftar, When data baru dikirim, Then aplikasi menampilkan pesan "Nomor WhatsApp sudah terdaftar" dan data lama tidak tertimpa. |
| 3 | Given email tanpa tanda @, When data dikirim, Then formulir menampilkan pesan perbaikan. |
| 4 | Given pengguna mengetik sebagian nama di kolom cari, When daftar diperbarui, Then hanya pembeli yang cocok yang tampil. |
| 5 | Given pengguna menekan Hapus, When konfirmasi disetujui, Then pembeli hilang dari daftar. |

## **5.3 Modul Tiket**

Pengguna mencatat pembelian tiket berdasarkan event, pembeli, dan jumlah tiket, lalu memperbarui status dari menunggu bayar sampai hadir.

**User story:** Sebagai panitia, saya ingin mencatat dan memperbarui tiket, sehingga kuota terjaga dan kehadiran peserta dapat diperiksa.

### **Komponen UI**

| Komponen | Fungsi |
| :---- | :---- |
| Tabs | Menyaring tiket per status |
| Daftar atau kartu | Menampilkan tiket terbaru |
| Formulir dengan select | Memilih event dan pembeli, mengisi jumlah tiket |
| Tombol ubah status | Konfirmasi lunas dan *check-in* |
| Dialog konfirmasi | Memastikan sebelum membatalkan |

### **Operasi Firestore · koleksi tiket**

| Operasi | Perintah |
| :---- | :---- |
| Create | addDoc(collection(db, "tiket"), {...}) lalu updateDoc(doc(db, "event", eventId), { tiket\_terjual: increment(jumlah) }) |
| Read | getDocs(query(collection(db, "tiket"), orderBy("dibuat\_pada", "desc"), limit(20))) |
| Update | updateDoc(doc(db, "tiket", id), { status }) |
| Delete | deleteDoc(doc(db, "tiket", id)) |

### **Acceptance criteria**

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given event, pembeli, dan jumlah tiket sah, When tiket disimpan, Then total sama dengan harga tiket dikali jumlah, status awal menunggu\_bayar, dan tiket terjual pada event bertambah. |
| 2 | Given jumlah tiket 0, lebih dari 5, atau melebihi sisa kuota, When tiket dikirim, Then permintaan ditolak. |
| 3 | Given tiket berstatus menunggu\_bayar, When status diubah, Then status hanya boleh menjadi lunas atau dibatalkan, tidak bisa langsung hadir. |
| 4 | Given tiket dibatalkan, When perubahan tersimpan, Then tiket terjual pada event berkurang sebanyak jumlah tiket. |
| 5 | Given harga event diubah setelah tiket dibuat, When tiket lama dibuka, Then total tiket lama tidak berubah. |

## **5.4 Modul Rekap**

Pengguna memilih event dan melihat tiket terjual, sisa kuota, pendapatan, dan jumlah peserta hadir. Pendapatan dihitung dari tiket berstatus lunas dan hadir.

**User story:** Sebagai penyelenggara, saya ingin melihat rekap per event, sehingga uang masuk dan kehadiran dapat dicocokkan.

### **Komponen UI**

| Komponen | Fungsi |
| :---- | :---- |
| Select event | Memilih event yang direkap |
| Kartu angka | Menampilkan terjual, sisa kuota, pendapatan, dan hadir |
| Batang kemajuan | Membandingkan tiket terjual dengan kuota |
| Skeleton | Tampil saat rekap dimuat |

### **Operasi Firestore · koleksi event dan tiket**

| Operasi | Perintah |
| :---- | :---- |
| Read | getDoc(doc(db, "event", eventId)) |
| Read | getDocs(query(collection(db, "tiket"), where("event\_id", "==", eventId))) |

### **Acceptance criteria**

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given event dipilih, When rekap dimuat, Then tiket terjual, sisa kuota, pendapatan, dan jumlah hadir tampil. |
| 2 | Given ada tiket berstatus menunggu\_bayar atau dibatalkan, When pendapatan dihitung, Then tiket tersebut tidak ikut dihitung. |
| 3 | Given event belum memiliki tiket, When rekap dibuka, Then aplikasi menampilkan *empty state*. |
| 4 | Given koneksi terputus, When rekap gagal dimuat, Then aplikasi menampilkan *error state* dengan tombol Coba Lagi. |

# **6\. Identitas Visual dan Prinsip Antarmuka**

Tampilan mengikuti design system yang dipasang sebagai skill, dengan prioritas keterbacaan pada layar telepon genggam.

| Elemen | Ketentuan |
| :---- | :---- |
| Warna | Gunakan token warna dari design system. Status berhasil, galat, dan label status data harus memiliki pembeda yang jelas. |
| Tipografi | Pilih satu font antarmuka dan fallback sans-serif. |
| Formulir | Letakkan label di atas *field* dan pesan galat di dekat *field*. |
| State | Bedakan *loading*, *empty*, dan *error* pada setiap halaman daftar. |
| Tombol | Gunakan label yang menyebut hasil, misalnya Simpan Tiket atau Hapus Event. Satu tombol utama per layar. Tombol hapus berwarna bahaya dan selalu dikonfirmasi. |
| Navigasi | Navbar berisi 4 menu sesuai modul: Event, Pembeli, Tiket, Rekap. |

# **7\. Kebutuhan Non-Fungsional**

* Aplikasi dapat dibuka melalui peramban pada layar telepon genggam.

* Data tersimpan di Firestore dan dapat dibaca kembali setelah halaman dimuat ulang.

* Daftar selalu dibatasi dengan limit dan tidak memuat seluruh koleksi.

* Pesan galat menjelaskan masalah dan tindakan berikutnya tanpa menampilkan rincian teknis.

* Sesi tugas mandiri memakai satu peran. *Authentication* dan *authorization* antarperan ditunda.

* Kunci rahasia dan kredensial layanan tidak disimpan di repository.

# **8\. Teknologi yang Digunakan**

| Lapisan | Teknologi | Catatan |
| :---- | :---- | :---- |
| Antarmuka | React | Dibangun bertahap melalui Antigravity, sama seperti App 2 Dapur Nia. |
| Tampilan | Design system Sesi 3 | Token warna, huruf, jarak, dan aturan komponen dipasang sebagai skill di .agents/skills/. |
| Basis data | Cloud Firestore | Firebase JavaScript SDK versi modular: addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc. |
| Aturan data | Firestore Security Rules | Disimpan pada berkas firestore.rules di repository. |
| Pengelolaan kode | Git dan GitHub | Simpan perubahan (*commit*) setiap selesai satu tahap. |
| Publikasi | Netlify | Repository GitHub diterbitkan menjadi URL publik. |

## **Teknologi per Modul**

| Modul | Koleksi | Komponen utama | Operasi Firestore |
| :---- | :---- | :---- | :---- |
| Event | event | Kartu event, Formulir dengan pemilih tanggal, Dialog konfirmasi | Create, Read, Update, Delete |
| Pembeli | pembeli | Kolom cari, Tabel atau daftar, Formulir | Create, Read, Update, Delete |
| Tiket | tiket | Tabs, Daftar atau kartu, Formulir dengan select | Create, Read, Update, Delete |
| Rekap | event, tiket | Select event, Kartu angka, Batang kemajuan | Read |

# **9\. Pengujian**

Peserta menguji setiap *acceptance criteria* melalui UI, konsol Firestore, dan URL publik. Uji tembus mandiri memakai enam masukan tidak sah: *field* kosong, tipe salah, teks terlalu panjang, nilai negatif, nilai di luar batas, dan perubahan status tidak sah. Hasil dicatat bersama jalur pengiriman dan kondisi data akhir.

# **10\. Batas Lingkup Pekerjaan**

| Tidak termasuk v1 | Alasan |
| :---- | :---- |
| Pembelian mandiri oleh pembeli | Pembelian dicatat oleh panitia. |
| Pembayaran daring | Transfer manual dicek panitia lalu dicatat lewat status lunas. |
| Kode QR tiket | Kehadiran dicatat dengan mencari nama atau nomor pembeli. |
| Kursi bernomor | Event memakai kuota tanpa denah kursi. |
| Konsistensi kuota lintas transaksi secara penuh | Memerlukan *transaction* yang dibahas sebagai pengayaan. |

Setelah PRD dipakai, nama koleksi, *field*, alur inti, dan tiga *invariant* tidak diubah tanpa persetujuan mentor.

# **11\. Kamus Istilah**

| Istilah | Arti |
| :---- | :---- |
| CRUD | Operasi membuat, membaca, mengubah, dan menghapus data. |
| Koleksi | Kelompok dokumen Firestore yang berkaitan. |
| Dokumen | Satu unit data di dalam koleksi. |
| *Field* | Nama dan nilai atribut di dalam dokumen. |
| *Acceptance criteria* | Syarat yang harus terpenuhi agar fitur dianggap selesai, ditulis dengan pola Given, When, Then. |
| *Security rules* | Aturan Firestore yang menentukan permintaan yang boleh diterima atau ditolak. |
| *Invariant* | Aturan yang harus tetap benar sebelum dan sesudah operasi. |
| *Loading state* | Tampilan saat aplikasi menunggu proses. |
| *Empty state* | Tampilan saat pembacaan berhasil tetapi belum ada data. |
| *Error state* | Tampilan saat proses gagal atau ditolak. |
| *Deploy* | Proses menerbitkan aplikasi ke URL publik. |

