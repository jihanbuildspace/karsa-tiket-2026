import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ticket, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  UserCheck, 
  Ban, 
  X, 
  Check, 
  AlertCircle, 
  DollarSign,
  Layers,
  Sparkles,
  QrCode,
  Zap,
  Clock
} from 'lucide-react';
import { tiketService } from '../services/tiketService';
import { eventService } from '../services/eventService';
import { pembeliService } from '../services/pembeliService';
import { LoadingState, EmptyState, ErrorState } from '../components/StateFeedback';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

export const TiketPage = ({ onDataChange }) => {
  const { showToast } = useToast();

  const [tiketList, setTiketList] = useState([]);
  const [events, setEvents] = useState([]);
  const [pembeliList, setPembeliList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    event_id: '',
    pembeli_id: '',
    jumlah_tiket: 1
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Action Modal State
  const [statusAction, setStatusAction] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tickets, evs, buyers] = await Promise.all([
        tiketService.getTiket(),
        eventService.getEvents(),
        pembeliService.getPembeli()
      ]);
      setTiketList(tickets);
      setEvents(evs);
      setPembeliList(buyers);
      if (onDataChange) onDataChange(tickets.length);
    } catch (err) {
      console.error('Error fetching tiket data:', err);
      setError(err.message || 'Gagal memuat data tiket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    const availableEvent = events.find(e => ((e.kuota || 0) - (e.tiket_terjual || 0)) > 0) || events[0];
    const defaultBuyer = pembeliList[0];

    setFormData({
      event_id: availableEvent ? availableEvent.id : '',
      pembeli_id: defaultBuyer ? (defaultBuyer.no_whatsapp || defaultBuyer.id) : '',
      jumlah_tiket: 1
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === formData.event_id) || null;
  }, [events, formData.event_id]);

  const sisaKuotaSelected = useMemo(() => {
    if (!selectedEvent) return 0;
    return Math.max(0, (selectedEvent.kuota || 0) - (selectedEvent.tiket_terjual || 0));
  }, [selectedEvent]);

  const calculatedTotal = useMemo(() => {
    if (!selectedEvent) return 0;
    const qty = parseInt(formData.jumlah_tiket, 10) || 0;
    return (selectedEvent.harga_tiket || 0) * qty;
  }, [selectedEvent, formData.jumlah_tiket]);

  const validateForm = () => {
    const errors = {};
    if (!formData.event_id) {
      errors.event_id = 'Pilih event terlebih dahulu';
    }
    if (!formData.pembeli_id) {
      errors.pembeli_id = 'Pilih pembeli terlebih dahulu';
    }
    const qty = parseInt(formData.jumlah_tiket, 10);
    if (isNaN(qty) || qty < 1 || qty > 5) {
      errors.jumlah_tiket = 'Jumlah tiket harus antara 1 sampai 5';
    } else if (qty > sisaKuotaSelected) {
      errors.jumlah_tiket = `Jumlah tiket melebihi sisa kuota event (${sisaKuotaSelected} kursi)`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await tiketService.addTiket(formData);
      showToast('Tiket berhasil dicatat dengan status menunggu_bayar!', 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Gagal membuat tiket', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerStatusChange = (tiket, targetStatus) => {
    if (targetStatus === 'lunas') {
      setStatusAction({
        tiket,
        targetStatus: 'lunas',
        title: 'Konfirmasi Pembayaran Lunas',
        message: `Konfirmasi pembayaran lunas untuk tiket "${tiket.nama_event}" atas nama ${tiket.nama_pembeli} (${tiket.jumlah_tiket} tiket - Total ${formatRupiah(tiket.total)})?`,
        confirmLabel: 'Ya, Konfirmasi Lunas',
        isDanger: false
      });
    } else if (targetStatus === 'dibatalkan') {
      setStatusAction({
        tiket,
        targetStatus: 'dibatalkan',
        title: 'Batalkan Tiket Pesanan',
        message: `Apakah Anda yakin ingin membatalkan tiket ini? Kuota ${tiket.jumlah_tiket} kursi akan dikembalikan otomatis ke event.`,
        confirmLabel: 'Ya, Batalkan Tiket',
        isDanger: true
      });
    } else if (targetStatus === 'hadir') {
      setStatusAction({
        tiket,
        targetStatus: 'hadir',
        title: 'Check-in Peserta di Lokasi Acara',
        message: `Konfirmasi kedatangan ${tiket.nama_pembeli} pada acara "${tiket.nama_event}" (${tiket.jumlah_tiket} orang)?`,
        confirmLabel: 'Tandai Hadir (Check-in)',
        isDanger: false
      });
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusAction) return;
    setIsUpdatingStatus(true);
    try {
      await tiketService.updateTiketStatus(statusAction.tiket.id, statusAction.targetStatus);
      showToast(`Status tiket berhasil diubah menjadi "${statusAction.targetStatus}"!`, 'success');
      setStatusAction(null);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Gagal mengubah status tiket', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await tiketService.deleteTiket(deleteTarget.id);
      showToast('Tiket berhasil dihapus!', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus tiket', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tiketList;
    return tiketList.filter(t => t.status === statusFilter);
  }, [tiketList, statusFilter]);

  const formatRupiah = (val) => {
    if (val === 0) return 'Gratis';
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  const getStatusBadge = (status) => {
    const map = {
      menunggu_bayar: { label: '⏳ Menunggu Bayar', class: 'menunggu_bayar' },
      lunas: { label: '💳 Lunas', class: 'lunas' },
      hadir: { label: '🎟️ Hadir (Check-in)', class: 'hadir' },
      dibatalkan: { label: '✕ Dibatalkan', class: 'dibatalkan' }
    };
    const info = map[status] || { label: status, class: '' };
    return <span className={`status-pill ${info.class}`}>{info.label}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h1>
            <Ticket size={26} color="#a855f7" />
            <span>Daftar Tiket & Transaksi</span>
          </h1>
          <p>Catat pesanan tiket, validasi pembayaran transfer, dan proses check-in kehadiran peserta.</p>
        </div>
        <button id="btn-tambah-tiket" type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Buat Tiket Baru</span>
        </button>
      </div>

      {/* Filter Tabs with Glowing Badges */}
      <div className="filter-tabs">
        <button
          type="button"
          className={`filter-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Semua Tiket ({tiketList.length})
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${statusFilter === 'menunggu_bayar' ? 'active' : ''}`}
          onClick={() => setStatusFilter('menunggu_bayar')}
        >
          Menunggu Bayar ({tiketList.filter(t => t.status === 'menunggu_bayar').length})
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${statusFilter === 'lunas' ? 'active' : ''}`}
          onClick={() => setStatusFilter('lunas')}
        >
          Lunas ({tiketList.filter(t => t.status === 'lunas').length})
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${statusFilter === 'hadir' ? 'active' : ''}`}
          onClick={() => setStatusFilter('hadir')}
        >
          Hadir ({tiketList.filter(t => t.status === 'hadir').length})
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${statusFilter === 'dibatalkan' ? 'active' : ''}`}
          onClick={() => setStatusFilter('dibatalkan')}
        >
          Dibatalkan ({tiketList.filter(t => t.status === 'dibatalkan').length})
        </button>
      </div>

      {loading && <LoadingState message="Memuat daftar transaksi tiket..." />}

      {!loading && error && (
        <ErrorState description={error} onRetry={fetchData} />
      )}

      {!loading && !error && tiketList.length === 0 && (
        <EmptyState
          title="Belum Ada Tiket"
          description="Belum ada transaksi pembelian tiket yang tercatat. Buat pesanan tiket pertamamu sekarang!"
          actionLabel="Buat Tiket Baru"
          onAction={handleOpenAdd}
        />
      )}

      {!loading && !error && tiketList.length > 0 && filteredTickets.length === 0 && (
        <EmptyState
          title="Tiket Tidak Ditemukan"
          description={`Tidak ada transaksi tiket dengan status "${statusFilter}".`}
          actionLabel="Tampilkan Semua Tiket"
          onAction={() => setStatusFilter('all')}
        />
      )}

      {!loading && !error && filteredTickets.length > 0 && (
        <div className="card-grid">
          {filteredTickets.map((tiket) => {
            return (
              <div key={tiket.id} className="ticket-stub" id={`card-tiket-${tiket.id}`}>
                {/* Holographic Header */}
                <div className="ticket-stub-header">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={13} color="#ec4899" />
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#e0e7ff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          KARSA PASS #{tiket.id}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
                        {tiket.nama_event}
                      </h3>
                    </div>
                    {getStatusBadge(tiket.status)}
                  </div>
                </div>

                <div className="ticket-stub-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)'
                      }}>
                        <User size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'white' }}>
                          {tiket.nama_pembeli}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {tiket.pembeli_id}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      background: 'rgba(15, 23, 42, 0.7)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-glass)'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tanggal Acara</span>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#e2e8f0' }}>
                          {tiket.tanggal_event}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kuantitas Tiket</span>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#38bdf8' }}>
                          {tiket.jumlah_tiket} Kursi
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Pembayaran</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', textShadow: '0 0 12px rgba(52, 211, 153, 0.4)' }}>
                        {formatRupiah(tiket.total)}
                      </span>
                    </div>
                  </div>

                  {/* Status Action Buttons with Glowing Styles */}
                  <div style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: '1px solid var(--border-glass)'
                  }}>
                    {tiket.status === 'menunggu_bayar' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => handleTriggerStatusChange(tiket, 'lunas')}
                        >
                          <CheckCircle2 size={16} />
                          <span>Konfirmasi Lunas</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => handleTriggerStatusChange(tiket, 'dibatalkan')}
                          title="Batalkan Pesanan Tiket"
                        >
                          <Ban size={16} />
                          <span>Batalkan</span>
                        </button>
                      </div>
                    )}

                    {tiket.status === 'lunas' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                        onClick={() => handleTriggerStatusChange(tiket, 'hadir')}
                      >
                        <UserCheck size={17} />
                        <span>Check-in (Tandai Hadir di Acara)</span>
                      </button>
                    )}

                    {tiket.status === 'hadir' && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <CheckCircle2 size={17} />
                        <span>Peserta Sudah Check-in di Lokasi</span>
                      </div>
                    )}

                    {tiket.status === 'dibatalkan' && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(244, 63, 94, 0.15)',
                        border: '1px solid rgba(244, 63, 94, 0.4)',
                        color: '#fda4af',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <Ban size={17} />
                        <span>Pembelian Dibatalkan (Kuota Dikembalikan)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket Stub Footer with Faux Barcode */}
                <div className="ticket-stub-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <QrCode size={18} color="#a855f7" />
                    <div style={{
                      height: 14,
                      width: 65,
                      background: 'repeating-linear-gradient(90deg, #94a3b8, #94a3b8 2px, transparent 2px, transparent 4px)',
                      opacity: 0.6
                    }} />
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => setDeleteTarget(tiket)}
                    title="Hapus Tiket"
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat Tiket */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buat Transaksi Tiket Baru</h3>
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
                {/* Event Select */}
                <div className="form-group">
                  <label className="form-label">
                    Pilih Acara / Event <span className="hint">Pilih dari jadwal</span>
                  </label>
                  {events.length === 0 ? (
                    <div style={{ color: '#f43f5e', fontSize: '0.85rem' }}>
                      Belum ada event tersedia. Silakan tambah event terlebih dahulu.
                    </div>
                  ) : (
                    <select
                      className={`form-select ${formErrors.event_id ? 'is-error' : ''}`}
                      value={formData.event_id}
                      onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                    >
                      <option value="">-- Pilih Event Acara --</option>
                      {events.map((ev) => {
                        const sisa = (ev.kuota || 0) - (ev.tiket_terjual || 0);
                        return (
                          <option key={ev.id} value={ev.id} disabled={sisa <= 0}>
                            {ev.nama} ({ev.tanggal}) • {formatRupiah(ev.harga_tiket)} [Sisa: {sisa} kursi] {sisa <= 0 ? '(HABIS)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  {formErrors.event_id && <span className="form-error"><AlertCircle size={13} /> {formErrors.event_id}</span>}
                </div>

                {/* Pembeli Select */}
                <div className="form-group">
                  <label className="form-label">
                    Pilih Kontak Pembeli <span className="hint">Nama & WhatsApp</span>
                  </label>
                  {pembeliList.length === 0 ? (
                    <div style={{ color: '#f43f5e', fontSize: '0.85rem' }}>
                      Belum ada data pembeli. Silakan tambah pembeli terlebih dahulu.
                    </div>
                  ) : (
                    <select
                      className={`form-select ${formErrors.pembeli_id ? 'is-error' : ''}`}
                      value={formData.pembeli_id}
                      onChange={(e) => setFormData({ ...formData, pembeli_id: e.target.value })}
                    >
                      <option value="">-- Pilih Pembeli Terdaftar --</option>
                      {pembeliList.map((p) => {
                        const phone = p.no_whatsapp || p.id;
                        return (
                          <option key={phone} value={phone}>
                            {p.nama} ({phone})
                          </option>
                        );
                      })}
                    </select>
                  )}
                  {formErrors.pembeli_id && <span className="form-error"><AlertCircle size={13} /> {formErrors.pembeli_id}</span>}
                </div>

                {/* Jumlah Tiket */}
                <div className="form-group">
                  <label className="form-label">
                    Jumlah Tiket <span className="hint">1 sampai 5 tiket</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.min(5, sisaKuotaSelected || 1)}
                    className={`form-input ${formErrors.jumlah_tiket ? 'is-error' : ''}`}
                    value={formData.jumlah_tiket}
                    onChange={(e) => setFormData({ ...formData, jumlah_tiket: e.target.value })}
                  />
                  {formErrors.jumlah_tiket && <span className="form-error"><AlertCircle size={13} /> {formErrors.jumlah_tiket}</span>}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Sisa kuota event terpilih: <strong style={{ color: '#34d399' }}>{sisaKuotaSelected} kursi</strong>
                  </span>
                </div>

                {/* Live Order Summary Box */}
                <div style={{
                  padding: 16,
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  marginTop: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#e2e8f0' }}>
                    <span>Harga Satuan:</span>
                    <strong>{formatRupiah(selectedEvent ? selectedEvent.harga_tiket : 0)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#e2e8f0', marginTop: 4 }}>
                    <span>Jumlah Tiket:</span>
                    <strong>{formData.jumlah_tiket} tiket</strong>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#34d399',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.2)',
                    paddingTop: 10,
                    marginTop: 10
                  }}>
                    <span>Total Pembayaran:</span>
                    <span style={{ fontSize: '1.3rem' }}>{formatRupiah(calculatedTotal)}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    * Tiket baru otomatis diawali dengan status <strong>menunggu_bayar</strong>.
                  </div>
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
                  disabled={isSubmitting || events.length === 0 || pembeliList.length === 0}
                >
                  <Check size={16} />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi Tiket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Status Action */}
      {statusAction && (
        <ConfirmModal
          isOpen={true}
          title={statusAction.title}
          message={statusAction.message}
          confirmLabel={statusAction.confirmLabel}
          cancelLabel="Batal"
          isDanger={statusAction.isDanger}
          isLoading={isUpdatingStatus}
          onConfirm={handleConfirmStatusChange}
          onClose={() => setStatusAction(null)}
        />
      )}

      {/* Modal Hapus Tiket */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Transaksi Tiket"
        message={`Apakah Anda yakin ingin menghapus data tiket untuk "${deleteTarget?.nama_pembeli}" pada event "${deleteTarget?.nama_event}"?`}
        confirmLabel="Ya, Hapus Tiket"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
