import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  X, 
  Check, 
  AlertCircle,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { pembeliService } from '../services/pembeliService';
import { LoadingState, EmptyState, ErrorState } from '../components/StateFeedback';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

export const PembeliPage = ({ onDataChange }) => {
  const { showToast } = useToast();

  const [pembeliList, setPembeliList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPembeli, setEditingPembeli] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    no_whatsapp: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPembeli = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pembeliService.getPembeli();
      setPembeliList(data);
      if (onDataChange) onDataChange(data.length);
    } catch (err) {
      console.error('Error fetching pembeli:', err);
      setError(err.message || 'Gagal memuat daftar pembeli.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPembeli();
  }, []);

  const handleOpenAdd = () => {
    setEditingPembeli(null);
    setFormData({
      nama: '',
      no_whatsapp: '',
      email: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pembeli) => {
    setEditingPembeli(pembeli);
    setFormData({
      nama: pembeli.nama || '',
      no_whatsapp: pembeli.no_whatsapp || pembeli.id || '',
      email: pembeli.email || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nama || formData.nama.trim().length < 1 || formData.nama.length > 60) {
      errors.nama = 'Nama pembeli wajib diisi (1 - 60 karakter)';
    }
    const cleanPhone = (formData.no_whatsapp || '').trim();
    if (!cleanPhone || !/^08\d{8,11}$/.test(cleanPhone)) {
      errors.no_whatsapp = 'Nomor WhatsApp harus diawali 08 dan memiliki panjang 10 sampai 13 angka';
    }
    const cleanEmail = (formData.email || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length > 80) {
      errors.email = 'Email harus mengandung tanda @ dan maksimal 80 karakter';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingPembeli) {
        await pembeliService.updatePembeli(editingPembeli.no_whatsapp || editingPembeli.id, {
          nama: formData.nama,
          email: formData.email
        });
        showToast('Data pembeli berhasil diperbarui!', 'success');
      } else {
        await pembeliService.addPembeli(formData);
        showToast('Pembeli baru berhasil didaftarkan!', 'success');
      }
      setIsModalOpen(false);
      fetchPembeli();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan pembeli', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const targetId = deleteTarget.no_whatsapp || deleteTarget.id;
      await pembeliService.deletePembeli(targetId);
      showToast(`Pembeli "${deleteTarget.nama}" berhasil dihapus!`, 'success');
      setDeleteTarget(null);
      fetchPembeli();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus pembeli', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return pembeliList;
    const term = searchTerm.toLowerCase().trim();
    return pembeliList.filter((p) => {
      const name = (p.nama || '').toLowerCase();
      const phone = (p.no_whatsapp || p.id || '').toLowerCase();
      return name.includes(term) || phone.includes(term);
    });
  }, [pembeliList, searchTerm]);

  const avatarGradients = [
    'linear-gradient(135deg, #6366f1, #a855f7)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #ea580c)'
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h1>
            <Users size={26} color="#06b6d4" />
            <span>Buku Kontak Pembeli</span>
          </h1>
          <p>Kelola data kontak peserta, verifikasi nomor WhatsApp, dan riwayat pesanan tiket.</p>
        </div>
        <button id="btn-tambah-pembeli" type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Tambah Pembeli Baru</span>
        </button>
      </div>

      {/* Futuristic Search Input */}
      <div className="search-box">
        <Search size={20} className="search-icon" color="#a855f7" />
        <input
          id="input-cari-pembeli"
          type="text"
          className="form-input"
          placeholder="Cari berdasarkan nama lengkap atau nomor WhatsApp (08...)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="clear-btn"
            onClick={() => setSearchTerm('')}
            title="Bersihkan pencarian"
          >
            <X size={18} color="var(--text-muted)" />
          </button>
        )}
      </div>

      {loading && <LoadingState message="Memuat kontak pembeli..." />}

      {!loading && error && (
        <ErrorState description={error} onRetry={fetchPembeli} />
      )}

      {!loading && !error && pembeliList.length === 0 && (
        <EmptyState
          title="Belum Ada Pembeli"
          description="Belum ada data kontak pembeli yang tercatat di sistem. Tambahkan pembeli pertamamu sekarang!"
          actionLabel="Tambah Pembeli Baru"
          onAction={handleOpenAdd}
        />
      )}

      {!loading && !error && pembeliList.length > 0 && filteredList.length === 0 && (
        <EmptyState
          title="Pembeli Tidak Ditemukan"
          description={`Tidak ditemukan data pembeli yang cocok dengan kata kunci "${searchTerm}".`}
          actionLabel="Reset Pencarian"
          onAction={() => setSearchTerm('')}
        />
      )}

      {!loading && !error && filteredList.length > 0 && (
        <div className="card-grid">
          {filteredList.map((pembeli, idx) => {
            const phone = pembeli.no_whatsapp || pembeli.id;
            const gradient = avatarGradients[idx % avatarGradients.length];
            const waUrl = `https://wa.me/62${phone.replace(/^0+/, '')}`;

            return (
              <div key={phone} className="card" id={`card-pembeli-${phone}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: gradient,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      boxShadow: '0 0 15px rgba(168, 85, 247, 0.35)',
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      {(pembeli.nama || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0 }}>
                        {pembeli.nama}
                      </h3>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        ID: {phone}
                      </span>
                    </div>
                  </div>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-icon-only"
                    style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    title="Buka Chat WhatsApp"
                  >
                    <MessageCircle size={17} />
                  </a>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  margin: '16px 0 14px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-glass)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem' }}>
                    <Phone size={15} color="#38bdf8" />
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>
                      {phone}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <Mail size={15} color="#ec4899" />
                    <span style={{ wordBreak: 'break-all' }}>{pembeli.email}</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-glass)',
                  paddingTop: 14,
                  marginTop: 'auto'
                }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                    Verified Buyer
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(pembeli)}
                      title="Ubah Pembeli"
                    >
                      <Edit3 size={14} />
                      <span>Ubah</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => setDeleteTarget(pembeli)}
                      title="Hapus Pembeli"
                    >
                      <Trash2 size={14} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Ubah Pembeli */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPembeli ? 'Ubah Data Pembeli' : 'Daftarkan Pembeli Baru'}</h3>
              <button
                type="button"
                className="btn-icon-only"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => !isSubmitting && setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Nama Lengkap <span className="hint">1 - 60 karakter</span>
                  </label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.nama ? 'is-error' : ''}`}
                    placeholder="contoh: Nadia Putri"
                    value={formData.nama}
                    maxLength={60}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                  {formErrors.nama && <span className="form-error"><AlertCircle size={13} /> {formErrors.nama}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Nomor WhatsApp <span className="hint">Diawali 08, 10-13 digit</span>
                  </label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.no_whatsapp ? 'is-error' : ''}`}
                    placeholder="contoh: 081355512345"
                    value={formData.no_whatsapp}
                    disabled={!!editingPembeli}
                    maxLength={13}
                    onChange={(e) => setFormData({ ...formData, no_whatsapp: e.target.value.replace(/\D/g, '') })}
                  />
                  {editingPembeli && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Nomor WhatsApp merupakan ID dokumen utama di Firestore dan tidak dapat diubah.
                    </span>
                  )}
                  {formErrors.no_whatsapp && <span className="form-error"><AlertCircle size={13} /> {formErrors.no_whatsapp}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Alamat Email <span className="hint">Mengandung tanda @, maks 80 karakter</span>
                  </label>
                  <input
                    type="email"
                    className={`form-input ${formErrors.email ? 'is-error' : ''}`}
                    placeholder="contoh: nadia.putri@contoh.id"
                    value={formData.email}
                    maxLength={80}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {formErrors.email && <span className="form-error"><AlertCircle size={13} /> {formErrors.email}</span>}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  <Check size={16} />
                  <span>{isSubmitting ? 'Menyimpan...' : (editingPembeli ? 'Simpan Perubahan' : 'Simpan Pembeli')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Data Pembeli"
        message={`Apakah Anda yakin ingin menghapus data kontak "${deleteTarget?.nama}" (${deleteTarget?.no_whatsapp || deleteTarget?.id})?`}
        confirmLabel="Ya, Hapus Pembeli"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
