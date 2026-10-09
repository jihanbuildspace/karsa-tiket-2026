import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ticket, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  CheckCircle, 
  UserCheck, 
  Ban, 
  X, 
  Check, 
  AlertCircle, 
  DollarSign,
  Layers
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
  const [statusAction, setStatusAction] = useState(null); // { tiket, targetStatus, title, message, isDanger }
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
    // Select first event that has remaining quota
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

  const selectedPembeli = useMemo(() => {
    return pembeliList.find(p => (p.no_whatsapp || p.id) === formData.pembeli_id) || null;
  }, [pembeliList, formData.pembeli_id]);

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

  // Status Transitions
  const handleTriggerStatusChange = (tiket, targetStatus) => {
    if (targetStatus === 'lunas') {
      setStatusAction({
        tiket,
        targetStatus: 'lunas',
        title: 'Konfirmasi Pembayaran Lunas',
        message: `Konfirmasi pembayaran lunas untuk tiket ${tiket.nama_event} (${tiket.nama_pembeli}, ${tiket.jumlah_tiket} tiket - Total ${formatRupiah(tiket.total)})?`,
        confirmLabel: 'Ya, Konfirmasi Lunas',
        isDanger: false
      });
    } else if (targetStatus === 'dibatalkan') {
      setStatusAction({
        tiket,
        targetStatus: 'dibatalkan',
        title: 'Batalkan Tiket',
        message: `Apakah Anda yakin ingin membatalkan tiket ini? Kuota ${tiket.jumlah_tiket} tiket akan dikembalikan ke event.`,
        confirmLabel: 'Ya, Batalkan Tiket',
        isDanger: true
      });
    } else if (targetStatus === 'hadir') {
      setStatusAction({
        tiket,
        targetStatus: 'hadir',
        title: 'Check-in Peserta (Hadir)',
        message: `Konfirmasi kehadiran ${tiket.nama_pembeli} pada acara ${tiket.nama_event}?`,
        confirmLabel: 'Check-in Sekarang',
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

  // Filtered Tickets
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
      menunggu_bayar: { label: 'Menunggu Bayar', class: 'menunggu_bayar' },
      lunas: { label: 'Lunas', class: 'lunas' },
      hadir: { label: 'Hadir (Check-in)', class: 'hadir' },
      dibatalkan: { label: 'Dibatalkan', class: 'dibatalkan' }
    };
    const info = map[status] || { label: status, class: '' };
    return <span className={`status-pill ${info.class}`}>{info.label}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h1>Daftar Tiket</h1>
          <p>Catat transaksi tiket, verifikasi pembayaran, dan lakukan check-in kehadiran.</p>
        </div>
        <button id="btn-tambah-tiket" type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Buat Tiket Baru</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          type="button"
          className={`filter-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Semua ({tiketList.length})
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

      {loading && <LoadingState message="Memuat daftar tiket..." />}

      {!loading && error && (
        <ErrorState description={error} onRetry={fetchData} />
      )}

      {!loading && !error && tiketList.length === 0 && (
        <EmptyState
          title="Belum Ada Tiket"
          description="Belum ada transaksi pembelian tiket yang tercatat."
          actionLabel="Buat Tiket Baru"
          onAction={handleOpenAdd}
        />
      )}

      {!loading && !error && tiketList.length > 0 && filteredTickets.length === 0 && (
        <EmptyState
          title="Tiket Tidak Ditemukan"
          description={`Tidak ada tiket dengan status filter "${statusFilter}".`}
          actionLabel="Tampilkan Semua Tiket"
          onAction={() => setStatusFilter('all')}
        />
      )}

      {!loading && !error && filteredTickets.length > 0 && (
        <div className="card-grid">
          {filteredTickets.map((tiket) => {
            return (
              <div key={tiket.id} className="card" id={`card-tiket-${tiket.id}`}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title" style={{ fontSize: '1.05rem' }}>{tiket.nama_event}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID Tiket: {tiket.id}
                    </span>
                  </div>
                  {getStatusBadge(tiket.status)}
                </div>

                <div className="card-meta">
                  <div className="card-meta-item">
                    <User size={15} className="text-muted" />
                    <span><strong>{tiket.nama_pembeli}</strong> ({tiket.pembeli_id})</span>
                  </div>
                  <div className="card-meta-item">
                    <Calendar size={15} className="text-muted" />
                    <span>Tanggal Event: {tiket.tanggal_event}</span>
                  </div>
                  <div className="card-meta-item">
                    <Layers size={15} className="text-muted" />
                    <span>Jumlah: <strong>{tiket.jumlah_tiket} tiket</strong> @ {formatRupiah(tiket.harga_tiket)}</span>
                  </div>
                  <div className="card-meta-item" style={{ marginTop: 4 }}>
                    <DollarSign size={15} className="text-muted" />
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                      Total: {formatRupiah(tiket.total)}
                    </span>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-main)',
                  margin: '10px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Alur Status:
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {tiket.status === 'menunggu_bayar' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          style={{ flex: 1, padding: '5px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleTriggerStatusChange(tiket, 'lunas')}
                        >
                          <CheckCircle size={14} />
                          Konfirmasi Lunas
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleTriggerStatusChange(tiket, 'dibatalkan')}
                        >
                          <Ban size={14} />
                          Batalkan
                        </button>
                      </>
                    )}

                    {tiket.status === 'lunas' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleTriggerStatusChange(tiket, 'hadir')}
                      >
                        <UserCheck size={15} />
                        Check-in (Tandai Hadir)
                      </button>
                    )}

                    {tiket.status === 'hadir' && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={15} /> Peserta Sudah Check-in di Lokasi
                      </span>
                    )}

                    {tiket.status === 'dibatalkan' && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--danger-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Ban size={15} /> Pembelian Dibatalkan (Kuota Dikembalikan)
                      </span>
                    )}
                  </div>
                </div>

                <div className="card-footer">
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {tiket.dibuat_pada ? new Date(tiket.dibuat_pada).toLocaleDateString('id-ID') : 'Baru saja'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => setDeleteTarget(tiket)}
                    title="Hapus Tiket"
                  >
                    <Trash2 size={14} />
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
                    Pilih Acara / Event <span className="hint">Pilih dari daftar</span>
                  </label>
                  {events.length === 0 ? (
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                      Belum ada event tersedia. Silakan tambah event terlebih dahulu.
                    </div>
                  ) : (
                    <select
                      className={`form-select ${formErrors.event_id ? 'is-error' : ''}`}
                      value={formData.event_id}
                      onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                    >
                      <option value="">-- Pilih Event --</option>
                      {events.map((ev) => {
                        const sisa = (ev.kuota || 0) - (ev.tiket_terjual || 0);
                        return (
                          <option key={ev.id} value={ev.id} disabled={sisa <= 0}>
                            {ev.nama} ({ev.tanggal}) - {formatRupiah(ev.harga_tiket)} [Sisa: {sisa} kursi] {sisa <= 0 ? '(HABIS)' : ''}
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
                    Pilih Pembeli <span className="hint">Berdasarkan nama & WhatsApp</span>
                  </label>
                  {pembeliList.length === 0 ? (
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                      Belum ada data pembeli. Silakan tambah pembeli terlebih dahulu.
                    </div>
                  ) : (
                    <select
                      className={`form-select ${formErrors.pembeli_id ? 'is-error' : ''}`}
                      value={formData.pembeli_id}
                      onChange={(e) => setFormData({ ...formData, pembeli_id: e.target.value })}
                    >
                      <option value="">-- Pilih Pembeli --</option>
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
                    Jumlah Tiket <span className="hint">1 sampai 5 (Maks. sisa kuota)</span>
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Sisa kuota event terpilih: <strong>{sisaKuotaSelected} kursi</strong>
                  </span>
                </div>

                {/* Ringkasan Total Otomatis */}
                <div style={{
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  border: '1px solid #c7d2fe',
                  marginTop: 10
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Harga Satuan:</span>
                    <strong>{formatRupiah(selectedEvent ? selectedEvent.harga_tiket : 0)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    <span>Jumlah:</span>
                    <strong>{formData.jumlah_tiket} tiket</strong>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    borderTop: '1px dashed #a5b4fc',
                    paddingTop: 8,
                    marginTop: 8
                  }}>
                    <span>Total Pembayaran:</span>
                    <span>{formatRupiah(calculatedTotal)}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    * Status awal tiket otomatis <strong>menunggu_bayar</strong>. Kuota event langsung dipotong saat dibuat.
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
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Tiket'}</span>
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
        confirmLabel="Hapus Tiket"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
