import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Layers, 
  TrendingUp,
  Ticket,
  ChevronDown,
  Sparkles,
  Percent
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { tiketService } from '../services/tiketService';
import { LoadingState, EmptyState, ErrorState } from '../components/StateFeedback';

export const RekapPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getEvents();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEventId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching events for rekap:', err);
      setError(err.message || 'Gagal memuat event.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setTickets([]);
      return;
    }
    const fetchTickets = async () => {
      setTicketsLoading(true);
      try {
        const data = await tiketService.getTiketByEventId(selectedEventId);
        setTickets(data);
      } catch (err) {
        console.error('Error fetching tickets for event:', err);
      } finally {
        setTicketsLoading(false);
      }
    };
    fetchTickets();
  }, [selectedEventId]);

  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const metrics = useMemo(() => {
    if (!selectedEvent) {
      return { terjual: 0, kuota: 0, sisa: 0, pendapatan: 0, hadir: 0, persentase: 0 };
    }

    const kuota = selectedEvent.kuota || 0;
    const terjual = selectedEvent.tiket_terjual || 0;
    const sisa = Math.max(0, kuota - terjual);
    const persentase = kuota > 0 ? Math.min(100, Math.round((terjual / kuota) * 100)) : 0;

    let pendapatan = 0;
    let hadir = 0;

    tickets.forEach((t) => {
      if (t.status === 'lunas' || t.status === 'hadir') {
        pendapatan += (t.total || (t.harga_tiket * t.jumlah_tiket) || 0);
      }
      if (t.status === 'hadir') {
        hadir += (t.jumlah_tiket || 1);
      }
    });

    return {
      kuota,
      terjual,
      sisa,
      pendapatan,
      hadir,
      persentase
    };
  }, [selectedEvent, tickets]);

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  const getStatusBadge = (status) => {
    const map = {
      menunggu_bayar: { label: 'Menunggu Bayar', class: 'menunggu_bayar' },
      lunas: { label: 'Lunas', class: 'lunas' },
      hadir: { label: 'Hadir', class: 'hadir' },
      dibatalkan: { label: 'Dibatalkan', class: 'dibatalkan' }
    };
    const info = map[status] || { label: status, class: '' };
    return <span className={`status-pill ${info.class}`}>{info.label}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h1>
            <span>Rekapitulasi Penjualan & Kehadiran</span>
          </h1>
          <p>Laporan pendapatan riil (Lunas & Hadir), sisa kuota kursi, dan rekapitulasi kehadiran.</p>
        </div>
      </div>

      {loading && <LoadingState message="Memuat ringkasan rekap..." />}

      {!loading && error && (
        <ErrorState description={error} onRetry={fetchEvents} />
      )}

      {!loading && !error && events.length === 0 && (
        <EmptyState
          title="Belum Ada Event"
          description="Tambahkan event terlebih dahulu di menu Event untuk melihat rekapitulasi penjualan."
        />
      )}

      {!loading && !error && events.length > 0 && (
        <div>
          {/* Event Selector Dropdown Card */}
          <div className="card" style={{ marginBottom: 22, padding: 20, borderRadius: 'var(--radius-xl)' }}>
            <label className="form-label" style={{ marginBottom: 8, fontSize: '0.9rem' }}>
              <span>Pilih Acara / Event untuk Ditampilkan:</span>
            </label>
            <select
              id="select-rekap-event"
              className="form-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{ fontSize: '1rem', fontWeight: 700, padding: '14px 18px', height: 'auto' }}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nama} ({ev.tanggal}) • {ev.harga_tiket === 0 ? 'Gratis' : formatRupiah(ev.harga_tiket)} [Terjual: {ev.tiket_terjual || 0}/{ev.kuota}]
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <>
              {/* Metric Cards Grid */}
              <div className="metrics-grid">
                {/* Tiket Terjual */}
                <div className="metric-card">
                  <div className="metric-icon-wrap" style={{ background: '#eef2ff', color: '#6366f1' }}>
                    <Layers size={22} />
                  </div>
                  <span className="metric-label">Tiket Terjual</span>
                  <div className="metric-value" style={{ color: 'var(--primary)' }}>
                    {metrics.terjual}
                  </div>
                  <span className="metric-sub">dari {metrics.kuota} total kursi</span>
                </div>

                {/* Sisa Kuota */}
                <div className="metric-card">
                  <div className="metric-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <Ticket size={22} />
                  </div>
                  <span className="metric-label">Sisa Kuota</span>
                  <div className="metric-value" style={{ color: metrics.sisa === 0 ? '#ef4444' : 'var(--text-title)' }}>
                    {metrics.sisa}
                  </div>
                  <span className="metric-sub">{metrics.sisa === 0 ? 'Kuota Habis' : 'Kursi Tersedia'}</span>
                </div>

                {/* Pendapatan Lunas + Hadir */}
                <div className="metric-card">
                  <div className="metric-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <DollarSign size={22} />
                  </div>
                  <span className="metric-label">Pendapatan Riil</span>
                  <div className="metric-value" style={{ color: '#059669', fontSize: '1.4rem' }}>
                    {formatRupiah(metrics.pendapatan)}
                  </div>
                  <span className="metric-sub">Dari status Lunas & Hadir</span>
                </div>

                {/* Jumlah Hadir */}
                <div className="metric-card">
                  <div className="metric-icon-wrap" style={{ background: '#fdf4ff', color: '#c026d3' }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <span className="metric-label">Peserta Hadir</span>
                  <div className="metric-value" style={{ color: '#c026d3' }}>
                    {metrics.hadir}
                  </div>
                  <span className="metric-sub">Sudah check-in di venue</span>
                </div>
              </div>

              {/* Progress Bar Okupansi */}
              <div className="card" style={{ marginBottom: 24, borderRadius: 'var(--radius-xl)', padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Percent size={18} color="var(--primary)" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-title)' }}>
                      Tingkat Keterisian Kuota (Okupansi)
                    </span>
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {metrics.persentase}%
                  </span>
                </div>
                <div className="quota-bar-wrapper" style={{ height: 14 }}>
                  <div
                    className={`quota-bar-fill ${metrics.sisa === 0 ? 'full' : ''}`}
                    style={{ width: `${metrics.persentase}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  <span>0 Kursi Terisi</span>
                  <span>Kapasitas Maksimal: <strong>{metrics.kuota} Kursi</strong></span>
                </div>
              </div>

              {/* Tiket Breakdown List */}
              <div style={{ marginTop: 26 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)', marginBottom: 14 }}>
                  Rincian Transaksi Tiket ({tickets.length} Pembelian)
                </h3>

                {ticketsLoading && <LoadingState count={2} message="Memuat rincian transaksi..." />}

                {!ticketsLoading && tickets.length === 0 && (
                  <EmptyState
                    title="Belum Ada Pembelian Tiket"
                    description={`Event "${selectedEvent.nama}" belum memiliki catatan transaksi tiket.`}
                  />
                )}

                {!ticketsLoading && tickets.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tickets.map((t) => (
                      <div 
                        key={t.id} 
                        className="card" 
                        style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-title)' }}>{t.nama_pembeli}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {t.pembeli_id} • <strong>{t.jumlah_tiket} tiket</strong> ({formatRupiah(t.total)})
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {getStatusBadge(t.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
