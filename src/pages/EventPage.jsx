import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Users, 
  Check, 
  Clock, 
  Tag,
  AlertCircle
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { LoadingState, EmptyState, ErrorState } from '../components/StateFeedback';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

export const EventPage = ({ onDataChange }) => {
  const { showToast } = useToast();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    tanggal: new Date().toISOString().split('T')[0],
    lokasi: '',
    harga_tiket: 0,
    kuota: 50
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getEvents();
      setEvents(data);
      if (onDataChange) onDataChange(data.length);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Gagal memuat daftar event.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      nama: '',
      tanggal: new Date().toISOString().split('T')[0],
      lokasi: '',
      harga_tiket: 0,
      kuota: 50
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      nama: event.nama || '',
      tanggal: event.tanggal || '',
      lokasi: event.lokasi || '',
      harga_tiket: event.harga_tiket || 0,
      kuota: event.kuota || 50
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nama || formData.nama.trim().length < 1 || formData.nama.length > 60) {
      errors.nama = 'Nama event wajib diisi (1 - 60 karakter)';
    }
    if (!formData.tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(formData.tanggal)) {
      errors.tanggal = 'Tanggal wajib berformat YYYY-MM-DD';
    }
    if (!formData.lokasi || formData.lokasi.trim().length < 1 || formData.lokasi.length > 100) {
      errors.lokasi = 'Lokasi event wajib diisi (1 - 100 karakter)';
    }
    const hargaNum = parseInt(formData.harga_tiket, 10);
    if (isNaN(hargaNum) || hargaNum < 0) {
      errors.harga_tiket = 'Harga tiket tidak boleh negatif (minimal 0)';
    }
    const kuotaNum = parseInt(formData.kuota, 10);
    if (isNaN(kuotaNum) || kuotaNum < 1 || kuotaNum > 500) {
      errors.kuota = 'Kuota kursi harus antara 1 sampai 500';
    } else if (editingEvent && kuotaNum < (editingEvent.tiket_terjual || 0)) {
      errors.kuota = `Kuota tidak boleh lebih kecil dari tiket terjual (${editingEvent.tiket_terjual})`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, {
          ...formData,
          tiket_terjual: editingEvent.tiket_terjual || 0
        });
        showToast('Event berhasil diperbarui!', 'success');
      } else {
        await eventService.addEvent(formData);
        showToast('Event baru berhasil ditambahkan!', 'success');
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan data event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await eventService.deleteEvent(deleteTarget.id);
      showToast(`Event "${deleteTarget.nama}" berhasil dihapus!`, 'success');
      setDeleteTarget(null);
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus event', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRupiah = (val) => {
    if (val === 0) return 'Gratis';
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h1>Daftar Event</h1>
          <p>Kelola jadwal acara, lokasi, harga tiket, dan pantau kuota kursi.</p>
        </div>
        <button id="btn-tambah-event" type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Tambah Event</span>
        </button>
      </div>

      {loading && <LoadingState message="Memuat daftar event..." />}

      {!loading && error && (
        <ErrorState description={error} onRetry={fetchEvents} />
      )}

      {!loading && !error && events.length === 0 && (
        <EmptyState
          title="Belum Ada Event"
          description="Belum ada acara yang didaftarkan. Tambahkan event pertamamu sekarang!"
          actionLabel="Tambah Event"
          onAction={handleOpenAdd}
        />
      )}

      {!loading && !error && events.length > 0 && (
        <div className="card-grid">
          {events.map((event) => {
            const terjual = event.tiket_terjual || 0;
            const kuota = event.kuota || 0;
            const sisaKuota = Math.max(0, kuota - terjual);
            const isHabis = terjual >= kuota;
            const percentage = kuota > 0 ? Math.min(100, Math.round((terjual / kuota) * 100)) : 0;

            return (
              <div key={event.id} className="card" id={`card-event-${event.id}`}>
                <div className="card-header">
                  <h3 className="card-title">{event.nama}</h3>
                  <span className={`badge ${isHabis ? 'badge-habis' : (event.harga_tiket === 0 ? 'badge-gratis' : 'badge-tersedia')}`}>
                    {isHabis ? 'Habis' : (event.harga_tiket === 0 ? 'Gratis' : 'Tersedia')}
                  </span>
                </div>

                <div className="card-meta">
                  <div className="card-meta-item">
                    <Calendar size={15} className="text-muted" />
                    <span>{event.tanggal}</span>
                  </div>
                  <div className="card-meta-item">
                    <MapPin size={15} className="text-muted" />
                    <span style={{ wordBreak: 'break-word' }}>{event.lokasi}</span>
                  </div>
                  <div className="card-meta-item">
                    <Tag size={15} className="text-muted" />
                    <strong style={{ color: event.harga_tiket === 0 ? 'var(--success)' : 'var(--primary)' }}>
                      {formatRupiah(event.harga_tiket)}
                    </strong>
                  </div>
                </div>

                {/* Quota Progress */}
                <div style={{ margin: '12px 0 6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Terjual: <strong>{terjual}</strong> / {kuota} kursi</span>
                    <span>Sisa: <strong style={{ color: isHabis ? 'var(--danger)' : 'var(--text-main)' }}>{sisaKuota}</strong></span>
                  </div>
                  <div className="quota-bar-wrapper">
                    <div 
                      className={`quota-bar-fill ${isHabis ? 'full' : ''}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="card-footer">
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ID: {event.id}
                  </span>
                  <div className="action-buttons">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(event)}
                      title="Ubah Event"
                    >
                      <Edit3 size={14} />
                      <span>Ubah</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => setDeleteTarget(event)}
                      title="Hapus Event"
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

      {/* Modal Tambah / Ubah Event */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEvent ? 'Ubah Event' : 'Tambah Event Baru'}</h3>
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
                    Nama Event <span className="hint">1 - 60 karakter</span>
                  </label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.nama ? 'is-error' : ''}`}
                    placeholder="contoh: Workshop Sablon Tote Bag"
                    value={formData.nama}
                    maxLength={60}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                  {formErrors.nama && <span className="form-error"><AlertCircle size={13} /> {formErrors.nama}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Tanggal Acara <span className="hint">Format YYYY-MM-DD</span>
                  </label>
                  <input
                    type="date"
                    className={`form-input ${formErrors.tanggal ? 'is-error' : ''}`}
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  />
                  {formErrors.tanggal && <span className="form-error"><AlertCircle size={13} /> {formErrors.tanggal}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Lokasi <span className="hint">1 - 100 karakter</span>
                  </label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.lokasi ? 'is-error' : ''}`}
                    placeholder="contoh: Ruang Karsa, Jl. Merdeka No. 21"
                    value={formData.lokasi}
                    maxLength={100}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  />
                  {formErrors.lokasi && <span className="form-error"><AlertCircle size={13} /> {formErrors.lokasi}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">
                      Harga Tiket (Rp) <span className="hint">Min. 0</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={`form-input ${formErrors.harga_tiket ? 'is-error' : ''}`}
                      value={formData.harga_tiket}
                      onChange={(e) => setFormData({ ...formData, harga_tiket: e.target.value })}
                    />
                    {formErrors.harga_tiket && <span className="form-error"><AlertCircle size={13} /> {formErrors.harga_tiket}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Kuota Kursi <span className="hint">1 - 500</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      step="1"
                      className={`form-input ${formErrors.kuota ? 'is-error' : ''}`}
                      value={formData.kuota}
                      onChange={(e) => setFormData({ ...formData, kuota: e.target.value })}
                    />
                    {formErrors.kuota && <span className="form-error"><AlertCircle size={13} /> {formErrors.kuota}</span>}
                  </div>
                </div>

                {editingEvent && (
                  <div style={{
                    padding: 10,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-main)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Tiket sudah terjual: <strong>{editingEvent.tiket_terjual || 0}</strong> kursi. Kuota baru tidak boleh kurang dari angka ini.
                  </div>
                )}
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
                  <span>{isSubmitting ? 'Menyimpan...' : (editingEvent ? 'Simpan Perubahan' : 'Simpan Event')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Event"
        message={`Apakah Anda yakin ingin menghapus event "${deleteTarget?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Event"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
