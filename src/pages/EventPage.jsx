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
  AlertCircle,
  Sparkles
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

  const parseDateBox = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: '00', month: 'BLN' };
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
      const month = months[d.getMonth()];
      return { day, month };
    } catch {
      return { day: '00', month: 'BLN' };
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h1>
            <span>Jadwal Event Komunitas</span>
          </h1>
          <p>Kelola acara workshop, konser mini, lokasi, harga tiket, dan pantau kuota kursi.</p>
        </div>
        <button id="btn-tambah-event" type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Tambah Event Baru</span>
        </button>
      </div>

      {loading && <LoadingState message="Memuat daftar event komunitas..." />}

      {!loading && error && (
        <ErrorState description={error} onRetry={fetchEvents} />
      )}

      {!loading && !error && events.length === 0 && (
        <EmptyState
          title="Belum Ada Event"
          description="Belum ada acara yang didaftarkan. Tambahkan event pertamamu sekarang untuk mulai menjual tiket!"
          actionLabel="Tambah Event Baru"
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
            const { day, month } = parseDateBox(event.tanggal);

            return (
              <div key={event.id} className="card-event" id={`card-event-${event.id}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                    <div className="event-date-box">
                      <span className="event-date-day">{day}</span>
                      <span className="event-date-month">{month}</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)', lineHeight: 1.3, marginBottom: 4 }}>
                        {event.nama}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <MapPin size={14} color="var(--primary)" />
                        <span>{event.lokasi}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${isHabis ? 'badge-habis' : (event.harga_tiket === 0 ? 'badge-gratis' : 'badge-tersedia')}`}>
                    {isHabis ? '● Habis' : (event.harga_tiket === 0 ? '★ Gratis' : '✓ Tersedia')}
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  margin: '6px 0 14px',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)' }}>
                      Kapasitas Kursi
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isHabis ? '#ef4444' : 'var(--primary)' }}>
                      {terjual} / {kuota} ({percentage}%)
                    </span>
                  </div>
                  <div className="quota-bar-wrapper">
                    <div 
                      className={`quota-bar-fill ${isHabis ? 'full' : ''}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>Sisa kuota: <strong style={{ color: isHabis ? '#ef4444' : 'var(--text-title)' }}>{sisaKuota} kursi</strong></span>
                    <span style={{ fontWeight: 800, color: event.harga_tiket === 0 ? '#16a34a' : 'var(--primary)', fontSize: '0.85rem' }}>
                      {formatRupiah(event.harga_tiket)}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: 14,
                  marginTop: 'auto'
                }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
                    #{event.id}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
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
              <h3>{editingEvent ? 'Ubah Informasi Event' : 'Tambah Event Komunitas'}</h3>
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
                    Nama Acara <span className="hint">1 - 60 karakter</span>
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
                    Tanggal Acara <span className="hint">YYYY-MM-DD</span>
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
                    Lokasi Venue <span className="hint">1 - 100 karakter</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                      Total Kuota <span className="hint">1 - 500 kursi</span>
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
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-light)',
                    color: 'var(--primary-dark)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <Users size={16} />
                    <span>Tiket terjual: <strong>{editingEvent.tiket_terjual || 0} kursi</strong>. Kuota baru tidak boleh lebih kecil dari angka ini.</span>
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
        message={`Apakah Anda yakin ingin menghapus event "${deleteTarget?.nama}"? Seluruh data event ini akan dihapus dari sistem.`}
        confirmLabel="Ya, Hapus Event"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
