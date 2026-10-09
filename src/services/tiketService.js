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
  where, 
  orderBy, 
  limit, 
  increment, 
  serverTimestamp,
  getLocalDB,
  saveLocalDB
} from '../firebase/config';
import { eventService } from './eventService';
import { pembeliService } from './pembeliService';

export const tiketService = {
  // Read / List with orderBy("dibuat_pada", "desc") and limit(20)
  async getTiket() {
    if (isFirebaseLive && db) {
      try {
        const q = query(collection(db, 'tiket'), orderBy('dibuat_pada', 'desc'), limit(20));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        return list;
      } catch (err) {
        // Fallback if index not ready
        const querySnapshot = await getDocs(collection(db, 'tiket'));
        const list = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        return list.slice(0, 20);
      }
    } else {
      const localDB = getLocalDB();
      const list = [...localDB.tiket].sort((a, b) => new Date(b.dibuat_pada || 0) - new Date(a.dibuat_pada || 0)).slice(0, 20);
      return list;
    }
  },

  // Read tiket by Event ID for Rekap
  async getTiketByEventId(eventId) {
    if (isFirebaseLive && db) {
      const q = query(collection(db, 'tiket'), where('event_id', '==', eventId));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } else {
      const localDB = getLocalDB();
      return localDB.tiket.filter(t => t.event_id === eventId);
    }
  },

  // Create tiket
  async addTiket({ event_id, pembeli_id, jumlah_tiket }) {
    const jumlahNum = parseInt(jumlah_tiket, 10);
    if (isNaN(jumlahNum) || jumlahNum < 1 || jumlahNum > 5) {
      throw new Error('Jumlah tiket harus antara 1 sampai 5');
    }

    // Ambil data event
    const event = await eventService.getEventById(event_id);
    if (!event) {
      throw new Error('Event tidak ditemukan');
    }

    // Cek sisa kuota
    const sisaKuota = event.kuota - (event.tiket_terjual || 0);
    if (jumlahNum > sisaKuota) {
      throw new Error(`Jumlah tiket (${jumlahNum}) melebihi sisa kuota yang tersedia (${sisaKuota})`);
    }

    // Ambil data pembeli
    const pembeli = await pembeliService.getPembeliById(pembeli_id);
    if (!pembeli) {
      throw new Error('Pembeli tidak ditemukan');
    }

    const total = event.harga_tiket * jumlahNum;

    const payload = {
      event_id: event.id,
      nama_event: event.nama,
      tanggal_event: event.tanggal,
      pembeli_id: pembeli.id || pembeli.no_whatsapp,
      nama_pembeli: pembeli.nama,
      harga_tiket: event.harga_tiket,
      jumlah_tiket: jumlahNum,
      total: total,
      status: 'menunggu_bayar'
    };

    if (isFirebaseLive && db) {
      payload.dibuat_pada = serverTimestamp();
      
      // Simpan tiket
      const docRef = await addDoc(collection(db, 'tiket'), payload);
      
      // Tambah tiket_terjual pada event
      const eventRef = doc(db, 'event', event.id);
      await updateDoc(eventRef, {
        tiket_terjual: increment(jumlahNum)
      });

      return { id: docRef.id, ...payload };
    } else {
      payload.dibuat_pada = new Date().toISOString();
      const newId = 'Tk' + Math.random().toString(36).substring(2, 8);
      const newDoc = { id: newId, ...payload };
      
      const localDB = getLocalDB();
      localDB.tiket.push(newDoc);
      
      // Update tiket_terjual pada event di localDB
      const evIndex = localDB.event.findIndex(e => e.id === event.id);
      if (evIndex !== -1) {
        localDB.event[evIndex].tiket_terjual = (localDB.event[evIndex].tiket_terjual || 0) + jumlahNum;
      }
      
      saveLocalDB(localDB);
      return newDoc;
    }
  },

  // Update status tiket sesuai alur status
  async updateTiketStatus(id, newStatus) {
    let currentTiket = null;
    const localDB = !isFirebaseLive ? getLocalDB() : null;

    if (isFirebaseLive && db) {
      const docRef = doc(db, 'tiket', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Tiket tidak ditemukan');
      currentTiket = { id: docSnap.id, ...docSnap.data() };
    } else {
      currentTiket = localDB.tiket.find(t => t.id === id);
      if (!currentTiket) throw new Error('Tiket tidak ditemukan');
    }

    const currentStatus = currentTiket.status;

    // Validasi alur status
    if (currentStatus === 'menunggu_bayar') {
      if (newStatus !== 'lunas' && newStatus !== 'dibatalkan') {
        throw new Error(`Status menunggu_bayar hanya boleh diubah ke lunas atau dibatalkan`);
      }
    } else if (currentStatus === 'lunas') {
      if (newStatus !== 'hadir') {
        throw new Error(`Status lunas hanya boleh diubah ke hadir`);
      }
    } else if (currentStatus === 'hadir' || currentStatus === 'dibatalkan') {
      throw new Error(`Tiket berstatus ${currentStatus} sudah final dan tidak dapat diubah lagi`);
    } else {
      throw new Error(`Perubahan status tidak sah dari ${currentStatus} ke ${newStatus}`);
    }

    if (isFirebaseLive && db) {
      const docRef = doc(db, 'tiket', id);
      await updateDoc(docRef, { status: newStatus });

      // Jika dibatalkan, kurangi tiket_terjual pada event
      if (newStatus === 'dibatalkan' && currentTiket.event_id) {
        const eventRef = doc(db, 'event', currentTiket.event_id);
        await updateDoc(eventRef, {
          tiket_terjual: increment(-currentTiket.jumlah_tiket)
        });
      }

      return { ...currentTiket, status: newStatus };
    } else {
      const index = localDB.tiket.findIndex(t => t.id === id);
      localDB.tiket[index].status = newStatus;

      // Jika dibatalkan, kurangi tiket_terjual pada event
      if (newStatus === 'dibatalkan' && currentTiket.event_id) {
        const evIndex = localDB.event.findIndex(e => e.id === currentTiket.event_id);
        if (evIndex !== -1) {
          localDB.event[evIndex].tiket_terjual = Math.max(0, (localDB.event[evIndex].tiket_terjual || 0) - currentTiket.jumlah_tiket);
        }
      }

      saveLocalDB(localDB);
      return localDB.tiket[index];
    }
  },

  // Delete tiket with deleteDoc
  async deleteTiket(id) {
    if (isFirebaseLive && db) {
      const docRef = doc(db, 'tiket', id);
      await deleteDoc(docRef);
      return true;
    } else {
      const localDB = getLocalDB();
      localDB.tiket = localDB.tiket.filter(t => t.id !== id);
      saveLocalDB(localDB);
      return true;
    }
  }
};
