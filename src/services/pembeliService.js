import { 
  db, 
  isFirebaseLive, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  getLocalDB,
  saveLocalDB
} from '../firebase/config';

export const pembeliService = {
  // Read / List with orderBy("nama") and limit(20)
  async getPembeli() {
    if (isFirebaseLive && db) {
      const q = query(collection(db, 'pembeli'), orderBy('nama'), limit(20));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } else {
      const localDB = getLocalDB();
      const list = [...localDB.pembeli].sort((a, b) => (a.nama || '').localeCompare(b.nama || '')).slice(0, 20);
      return list;
    }
  },

  // Check if exists
  async getPembeliById(noWhatsapp) {
    if (isFirebaseLive && db) {
      const docRef = doc(db, 'pembeli', noWhatsapp);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } else {
      const localDB = getLocalDB();
      return localDB.pembeli.find(p => p.no_whatsapp === noWhatsapp || p.id === noWhatsapp) || null;
    }
  },

  // Create pembeli with getDoc check then setDoc
  async addPembeli({ nama, no_whatsapp, email }) {
    // Validasi
    if (!nama || nama.trim().length < 1 || nama.length > 60) {
      throw new Error('Nama pembeli harus 1 - 60 karakter');
    }
    const cleanPhone = (no_whatsapp || '').trim();
    if (!/^08\d{8,11}$/.test(cleanPhone)) {
      throw new Error('Nomor WhatsApp harus diawali 08 dan memiliki panjang 10 sampai 13 angka');
    }
    const cleanEmail = (email || '').trim();
    if (!cleanEmail.includes('@') || cleanEmail.length > 80) {
      throw new Error('Email harus mengandung tanda @ dan maksimal 80 karakter');
    }

    if (isFirebaseLive && db) {
      const docRef = doc(db, 'pembeli', cleanPhone);
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        throw new Error('Nomor WhatsApp sudah terdaftar');
      }

      const payload = {
        nama: nama.trim(),
        no_whatsapp: cleanPhone,
        email: cleanEmail,
        dibuat_pada: serverTimestamp()
      };
      await setDoc(docRef, payload);
      return { id: cleanPhone, ...payload };
    } else {
      const localDB = getLocalDB();
      const exists = localDB.pembeli.some(p => p.no_whatsapp === cleanPhone || p.id === cleanPhone);
      if (exists) {
        throw new Error('Nomor WhatsApp sudah terdaftar');
      }

      const payload = {
        id: cleanPhone,
        nama: nama.trim(),
        no_whatsapp: cleanPhone,
        email: cleanEmail,
        dibuat_pada: new Date().toISOString()
      };
      localDB.pembeli.push(payload);
      saveLocalDB(localDB);
      return payload;
    }
  },

  // Update pembeli
  async updatePembeli(noWhatsapp, { nama, email }) {
    if (!nama || nama.trim().length < 1 || nama.length > 60) {
      throw new Error('Nama pembeli harus 1 - 60 karakter');
    }
    const cleanEmail = (email || '').trim();
    if (!cleanEmail.includes('@') || cleanEmail.length > 80) {
      throw new Error('Email harus mengandung tanda @ dan maksimal 80 karakter');
    }

    const payload = {
      nama: nama.trim(),
      no_whatsapp: noWhatsapp,
      email: cleanEmail
    };

    if (isFirebaseLive && db) {
      const docRef = doc(db, 'pembeli', noWhatsapp);
      await updateDoc(docRef, payload);
      return { id: noWhatsapp, ...payload };
    } else {
      const localDB = getLocalDB();
      const index = localDB.pembeli.findIndex(p => p.no_whatsapp === noWhatsapp || p.id === noWhatsapp);
      if (index === -1) throw new Error('Pembeli tidak ditemukan');
      localDB.pembeli[index] = { ...localDB.pembeli[index], ...payload };
      saveLocalDB(localDB);
      return localDB.pembeli[index];
    }
  },

  // Delete pembeli
  async deletePembeli(noWhatsapp) {
    if (isFirebaseLive && db) {
      const docRef = doc(db, 'pembeli', noWhatsapp);
      await deleteDoc(docRef);
      return true;
    } else {
      const localDB = getLocalDB();
      localDB.pembeli = localDB.pembeli.filter(p => p.no_whatsapp !== noWhatsapp && p.id !== noWhatsapp);
      saveLocalDB(localDB);
      return true;
    }
  }
};
