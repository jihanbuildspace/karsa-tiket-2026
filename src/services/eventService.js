import { 
  db, 
  isFirebaseLive, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  getLocalDB,
  saveLocalDB
} from '../firebase/config';

export const eventService = {
  // Read / List with orderBy("tanggal") and limit(20)
  async getEvents() {
    if (isFirebaseLive && db) {
      const q = query(collection(db, 'event'), orderBy('tanggal'), limit(20));
      const querySnapshot = await getDocs(q);
      const events = [];
      querySnapshot.forEach((docSnap) => {
        events.push({ id: docSnap.id, ...docSnap.data() });
      });
      return events;
    } else {
      // Local fallback
      const localDB = getLocalDB();
      const events = [...localDB.event].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || '')).slice(0, 20);
      return events;
    }
  },

  // Get single event
  async getEventById(id) {
    if (isFirebaseLive && db) {
      const docRef = doc(db, 'event', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } else {
      const localDB = getLocalDB();
      return localDB.event.find(e => e.id === id) || null;
    }
  },

  // Create event with addDoc
  async addEvent({ nama, tanggal, lokasi, harga_tiket, kuota }) {
    // Validasi
    if (!nama || nama.trim().length < 1 || nama.length > 60) {
      throw new Error('Nama event harus 1 - 60 karakter');
    }
    if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      throw new Error('Tanggal harus berformat YYYY-MM-DD');
    }
    if (!lokasi || lokasi.trim().length < 1 || lokasi.length > 100) {
      throw new Error('Lokasi event harus 1 - 100 karakter');
    }
    const hargaNum = parseInt(harga_tiket, 10);
    if (isNaN(hargaNum) || hargaNum < 0) {
      throw new Error('Harga tiket minimal Rp 0');
    }
    const kuotaNum = parseInt(kuota, 10);
    if (isNaN(kuotaNum) || kuotaNum < 1 || kuotaNum > 500) {
      throw new Error('Kuota harus antara 1 sampai 500 kursi');
    }

    const payload = {
      nama: nama.trim(),
      tanggal,
      lokasi: lokasi.trim(),
      harga_tiket: hargaNum,
      kuota: kuotaNum,
      tiket_terjual: 0,
    };

    if (isFirebaseLive && db) {
      payload.dibuat_pada = serverTimestamp();
      const docRef = await addDoc(collection(db, 'event'), payload);
      return { id: docRef.id, ...payload };
    } else {
      payload.dibuat_pada = new Date().toISOString();
      const newId = 'Ev' + Math.random().toString(36).substring(2, 8);
      const newDoc = { id: newId, ...payload };
      const localDB = getLocalDB();
      localDB.event.push(newDoc);
      saveLocalDB(localDB);
      return newDoc;
    }
  },

  // Update event with updateDoc
  async updateEvent(id, { nama, tanggal, lokasi, harga_tiket, kuota, tiket_terjual }) {
    // Validasi
    if (!nama || nama.trim().length < 1 || nama.length > 60) {
      throw new Error('Nama event harus 1 - 60 karakter');
    }
    if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      throw new Error('Tanggal harus berformat YYYY-MM-DD');
    }
    if (!lokasi || lokasi.trim().length < 1 || lokasi.length > 100) {
      throw new Error('Lokasi event harus 1 - 100 karakter');
    }
    const hargaNum = parseInt(harga_tiket, 10);
    if (isNaN(hargaNum) || hargaNum < 0) {
      throw new Error('Harga tiket minimal Rp 0');
    }
    const kuotaNum = parseInt(kuota, 10);
    if (isNaN(kuotaNum) || kuotaNum < 1 || kuotaNum > 500) {
      throw new Error('Kuota harus antara 1 sampai 500 kursi');
    }
    const terjualNum = tiket_terjual !== undefined ? parseInt(tiket_terjual, 10) : 0;
    if (kuotaNum < terjualNum) {
      throw new Error(`Kuota (${kuotaNum}) tidak boleh lebih kecil dari tiket terjual (${terjualNum})`);
    }

    const payload = {
      nama: nama.trim(),
      tanggal,
      lokasi: lokasi.trim(),
      harga_tiket: hargaNum,
      kuota: kuotaNum,
    };

    if (isFirebaseLive && db) {
      const docRef = doc(db, 'event', id);
      await updateDoc(docRef, payload);
      return { id, ...payload, tiket_terjual: terjualNum };
    } else {
      const localDB = getLocalDB();
      const index = localDB.event.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Event tidak ditemukan');
      localDB.event[index] = { ...localDB.event[index], ...payload };
      saveLocalDB(localDB);
      return localDB.event[index];
    }
  },

  // Delete event with deleteDoc
  async deleteEvent(id) {
    if (isFirebaseLive && db) {
      const docRef = doc(db, 'event', id);
      await deleteDoc(docRef);
      return true;
    } else {
      const localDB = getLocalDB();
      localDB.event = localDB.event.filter(e => e.id !== id);
      saveLocalDB(localDB);
      return true;
    }
  }
};
