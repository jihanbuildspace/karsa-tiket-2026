// Data contoh awal sesuai Skema Firestore Karsa Tiket
export const initialEvents = [
  {
    id: "Ev27dKm",
    nama: "Workshop Sablon Tote Bag",
    tanggal: "2026-10-18",
    lokasi: "Ruang Karsa, Jl. Merdeka No. 21",
    harga_tiket: 75000,
    kuota: 30,
    tiket_terjual: 2,
    dibuat_pada: new Date("2026-10-01T08:00:00Z").toISOString()
  },
  {
    id: "Ev88kLp",
    nama: "Konser Mini Akustik Senja",
    tanggal: "2026-10-25",
    lokasi: "Amfiteater Komunitas",
    harga_tiket: 50000,
    kuota: 100,
    tiket_terjual: 100,
    dibuat_pada: new Date("2026-10-02T09:30:00Z").toISOString()
  },
  {
    id: "Ev12aBc",
    nama: "Pameran Seni Visual & Zine",
    tanggal: "2026-11-02",
    lokasi: "Galeri Karsa Utama",
    harga_tiket: 0,
    kuota: 50,
    tiket_terjual: 15,
    dibuat_pada: new Date("2026-10-03T11:00:00Z").toISOString()
  }
];

export const initialPembeli = [
  {
    id: "081355512345",
    nama: "Nadia Putri",
    no_whatsapp: "081355512345",
    email: "nadia.putri@contoh.id",
    dibuat_pada: new Date("2026-10-01T08:30:00Z").toISOString()
  },
  {
    id: "081298765432",
    nama: "Rian Pratama",
    no_whatsapp: "081298765432",
    email: "rian.pratama@mail.id",
    dibuat_pada: new Date("2026-10-01T09:00:00Z").toISOString()
  },
  {
    id: "085711223344",
    nama: "Siti Rahma",
    no_whatsapp: "085711223344",
    email: "siti.rahma@kreatif.org",
    dibuat_pada: new Date("2026-10-02T10:00:00Z").toISOString()
  }
];

export const initialTiket = [
  {
    id: "Tk63fHs",
    event_id: "Ev27dKm",
    nama_event: "Workshop Sablon Tote Bag",
    tanggal_event: "2026-10-18",
    pembeli_id: "081355512345",
    nama_pembeli: "Nadia Putri",
    harga_tiket: 75000,
    jumlah_tiket: 2,
    total: 150000,
    status: "menunggu_bayar",
    dibuat_pada: new Date("2026-10-01T09:15:00Z").toISOString()
  },
  {
    id: "Tk99xYz",
    event_id: "Ev88kLp",
    nama_event: "Konser Mini Akustik Senja",
    tanggal_event: "2026-10-25",
    pembeli_id: "081298765432",
    nama_pembeli: "Rian Pratama",
    harga_tiket: 50000,
    jumlah_tiket: 1,
    total: 50000,
    status: "lunas",
    dibuat_pada: new Date("2026-10-02T10:15:00Z").toISOString()
  },
  {
    id: "Tk11aBc",
    event_id: "Ev88kLp",
    nama_event: "Konser Mini Akustik Senja",
    tanggal_event: "2026-10-25",
    pembeli_id: "085711223344",
    nama_pembeli: "Siti Rahma",
    harga_tiket: 50000,
    jumlah_tiket: 2,
    total: 100000,
    status: "hadir",
    dibuat_pada: new Date("2026-10-02T11:00:00Z").toISOString()
  }
];
