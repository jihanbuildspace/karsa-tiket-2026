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

  // Filter pembeli based on search
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return pembeliList;
    const term = searchTerm.toLowerCase().trim();
    return pembeliList.filter((p) => {
      const name = (p.nama || '').toLowerCase();
      const phone = (p.no_whatsapp || p.id || '').toLowerCase();
      return name.includes(term) || phone.includes(term);
    });
  }, [pembeliList, searchTerm]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h1>Data Pembeli</h1>
          <p>Kelola kontak pembeli tiket berdasarkan nama dan nomor WhatsApp.</p>
        </div>
        <button id="btn-tambah-pembeli" type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Tambah Pembeli</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input
          id="input-cari-pembeli"
          type="text"
          className="form-input"
          placeholder="Cari pembeli berdasarkan nama atau nomor WhatsApp..."
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
            <X size={16} />
          </button>
        )}
      </div>

      {loading && <LoadingState message="Memuat daftar pembeli..." />}

      {!loading && error && (
        <ErrorState description={error} onRetry={fetchPembeli} />
      )}

      {!loading && !error && pembeliList.length === 0 && (
        <EmptyState
          title="Belum Ada Pembeli"
          description="Belum ada data kontak pembeli yang tercatat di sistem."
          actionLabel="Tambah Pembeli"
          onAction={handleOpenAdd}
        />
      )}

      {!loading && !error && pembeliList.length > 0 && filteredList.length === 0 && (
        <EmptyState
          title="Pembeli Tidak Ditemukan"
          description={`Tidak ada data pembeli yang cocok dengan kata kunci "${searchTerm}".`}
          actionLabel="Reset Pencarian"
          onAction={() => setSearchTerm('')}
        />
      )}

      {!loading && !error && filteredList.length > 0 && (
        <div className="card-grid">
          {filteredList.map((pembeli) => {
            const phone = pembeli.no_whatsapp || pembeli.id;
            return (
              <div key={phone} className="card" id={`card-pembeli-${phone}`}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}>
                      {(pembeli.nama || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="card-title" style={{ fontSize: '1rem', margin: 0 }}>{pembeli.nama}</h3>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ID: {phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-meta" style={{ marginTop: 12 }}>
                  <div className="card-meta-item">
                    <Phone size={15} className="text-muted" />
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>
                      {phone}
                    </span>
                  </div>
                  <div className="card-meta-item">
                    <Mail size={15} className="text-muted" />
                    <span style={{ wordBreak: 'break-all' }}>{pembeli.email}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Terdaftar di sistem
                  </span>
                  <div className="action-buttons">
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
              <h3>{editingPembeli ? 'Ubah Data Pembeli' : 'Tambah Pembeli Baru'}</h3>
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
                    Nomor WhatsApp <span className="hint">Diawali 08, 10-13 angka</span>
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
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Nomor WhatsApp merupakan ID dokumen dan tidak dapat diubah.
                    </span>
                  )}
                  {formErrors.no_whatsapp && <span className="form-error"><AlertCircle size={13} /> {formErrors.no_whatsapp}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Email <span className="hint">Harus mengandung @, maks 80 karakter</span>
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
        title="Hapus Pembeli"
        message={`Apakah Anda yakin ingin menghapus data pembeli "${deleteTarget?.nama}" (${deleteTarget?.no_whatsapp || deleteTarget?.id})?`}
        confirmLabel="Hapus Pembeli"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
