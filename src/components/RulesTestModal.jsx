import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Play, CheckCircle2, XCircle, X } from 'lucide-react';
import { eventService } from '../services/eventService';
import { pembeliService } from '../services/pembeliService';
import { tiketService } from '../services/tiketService';

export const RulesTestModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const testCases = [
    {
      id: 1,
      title: '1. Field Kosong (Nama Event Kosong)',
      description: 'Mencoba menyimpan event dengan nama kosong ("").',
      expected: 'Ditolak: Nama event harus 1 - 60 karakter',
      run: async () => {
        try {
          await eventService.addEvent({
            nama: '',
            tanggal: '2026-10-20',
            lokasi: 'Ruang Karsa',
            harga_tiket: 50000,
            kuota: 50
          });
          return { pass: false, message: 'Gagal! Data tidak sah berhasil tersimpan.' };
        } catch (e) {
          return { pass: true, message: `Berhasil ditolak: ${e.message}` };
        }
      }
    },
    {
      id: 2,
      title: '2. Tipe Salah / Email Tanpa @',
      description: 'Mencoba mendaftarkan pembeli dengan format email tidak sah ("nadiatanpaat.id").',
      expected: 'Ditolak: Email harus mengandung tanda @',
      run: async () => {
        try {
          await pembeliService.addPembeli({
            nama: 'Uji Email',
            no_whatsapp: '089999999999',
            email: 'nadiatanpaat.id'
          });
          return { pass: false, message: 'Gagal! Email tidak sah berhasil tersimpan.' };
        } catch (e) {
          return { pass: true, message: `Berhasil ditolak: ${e.message}` };
        }
      }
    },
    {
      id: 3,
      title: '3. Teks Terlalu Panjang / No WhatsApp Tidak Sah',
      description: 'Mencoba menyimpan nomor WhatsApp yang bukan format 08 atau panjang kurang dari 10 digit ("12345").',
      expected: 'Ditolak: Nomor WhatsApp harus diawali 08 dan 10-13 angka',
      run: async () => {
        try {
          await pembeliService.addPembeli({
            nama: 'Uji WA Salah',
            no_whatsapp: '12345',
            email: 'test@mail.com'
          });
          return { pass: false, message: 'Gagal! Format WA salah berhasil tersimpan.' };
        } catch (e) {
          return { pass: true, message: `Berhasil ditolak: ${e.message}` };
        }
      }
    },
    {
      id: 4,
      title: '4. Nilai Negatif / Kuota 0',
      description: 'Mencoba membuat event dengan harga tiket negatif (-20000) atau kuota 0.',
      expected: 'Ditolak: Harga tiket minimal Rp 0 / Kuota 1-500',
      run: async () => {
        try {
          await eventService.addEvent({
            nama: 'Event Negatif',
            tanggal: '2026-10-20',
            lokasi: 'Ruang Karsa',
            harga_tiket: -20000,
            kuota: 0
          });
          return { pass: false, message: 'Gagal! Harga negatif berhasil tersimpan.' };
        } catch (e) {
          return { pass: true, message: `Berhasil ditolak: ${e.message}` };
        }
      }
    },
    {
      id: 5,
      title: '5. Nilai di Luar Batas Jumlah Tiket',
      description: 'Mencoba memesan tiket dengan jumlah 0 atau lebih dari 5 tiket (contoh: 8 tiket).',
      expected: 'Ditolak: Jumlah tiket harus antara 1 sampai 5',
      run: async () => {
        try {
          await tiketService.addTiket({
            event_id: 'Ev27dKm',
            pembeli_id: '081355512345',
            jumlah_tiket: 8
          });
          return { pass: false, message: 'Gagal! Jumlah tiket > 5 berhasil tersimpan.' };
        } catch (e) {
          return { pass: true, message: `Berhasil ditolak: ${e.message}` };
        }
      }
    },
    {
      id: 6,
      title: '6. Perubahan Status Melompat Tidak Sah',
      description: 'Mencoba mengubah tiket menunggu_bayar langsung menjadi hadir (tanpa melewati lunas).',
      expected: 'Ditolak: Status menunggu_bayar hanya boleh ke lunas atau dibatalkan',
      run: async () => {
        try {
          // Tk63fHs berstatus menunggu_bayar
          await tiketService.updateTiketStatus('Tk63fHs', 'hadir');
          return { pass: false, message: 'Gagal! Status melompat berhasil dilakukan.' };
        } catch (e) {
          return { pass: true, message: `Berhasil ditolak: ${e.message}` };
        }
      }
    }
  ];

  const handleRunAll = async () => {
    setIsRunning(true);
    const results = {};
    for (const test of testCases) {
      const res = await test.run();
      results[test.id] = res;
    }
    setTestResults(results);
    setIsRunning(false);
  };

  const allPassed = Object.values(testResults).length === testCases.length && 
                    Object.values(testResults).every(r => r.pass);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Lembar Uji Mandiri Security Rules</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Pengujian 6 Masukan Tidak Sah sesuai Dokumen PRD & Skema
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-only" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Total Kasus Uji: <strong>6 Skenario</strong>
            </span>
            <button 
              type="button" 
              className="btn btn-primary btn-sm" 
              onClick={handleRunAll}
              disabled={isRunning}
            >
              <Play size={14} />
              {isRunning ? 'Menjalankan Uji...' : 'Jalankan Semua Uji (6 Kasus)'}
            </button>
          </div>

          {allPassed && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--success-bg)',
              color: 'var(--success-text)',
              border: '1px solid var(--success-border)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle2 size={18} />
              Semua 6 pengujian masukan tidak sah berhasil ditolak sesuai invariant & rules!
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {testCases.map((test) => {
              const res = testResults[test.id];
              return (
                <div 
                  key={test.id} 
                  style={{
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: res ? (res.pass ? 'var(--success-bg)' : 'var(--danger-bg)') : 'var(--bg-main)',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
                        {test.title}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
                        {test.description}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Target: <span style={{ color: 'var(--text-secondary)' }}>{test.expected}</span>
                      </div>
                    </div>
                    <div>
                      {res ? (
                        res.pass ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem' }}>
                            <CheckCircle2 size={18} /> Lolos
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger)', fontWeight: 700, fontSize: '0.8rem' }}>
                            <XCircle size={18} /> Gagal
                          </div>
                        )
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                          Belum Diuji
                        </span>
                      )}
                    </div>
                  </div>
                  {res && (
                    <div style={{
                      marginTop: 8,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.7)',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: res.pass ? 'var(--success-text)' : 'var(--danger-text)'
                    }}>
                      Hasil: {res.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Tutup Lembar Uji
          </button>
        </div>
      </div>
    </div>
  );
};
