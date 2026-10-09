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
  Percent,
  Award
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
      menunggu_bayar: { label: '⏳ Menunggu Bayar', class: 'menunggu_bayar' },
      lunas: { label: '💳 Lunas', class: 'lunas' },
      hadir: { label: '🎟️ Hadir', class: 'hadir' },
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
            <BarChart3 size={26} color="#ec4899" />
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
          <div className="card" style={{ marginBottom: 24, padding: 22 }}>
            <label className="form-label" style={{ marginBottom: 10, fontSize: '0.92rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="#fbbf24" />
                Pilih Acara / Event untuk Ditampilkan:
              </span>
            </label>
            <select
              id="select-rekap-event"
              className="form-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{ fontSize: '1.05rem', fontWeight: 800, padding: '14px 20px', height: 'auto' }}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nama} ({ev.tanggal}) • {ev.harga_tiket === 0 ? 'Gratis' : formatRupiah(ev.harga_tiket)} [Terjual: {ev.tiket_terjual || 0}/{ev.kuota} Kursi]
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <>
              {/* Glowing Metric Cards Grid */}
              <div className="metrics-grid">
                {/* Tiket Terjual */}
                <div className="metric-card" style={{ borderTop: '3px solid #a855f7' }}>
                  <div className="metric-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}>
                    <Layers size={22} />
                  </div>
                  <span className="metric-label">Tiket Terjual</span>
                  <div className="metric-value" style={{ color: '#d8b4fe' }}>
                    {metrics.terjual}
                  </div>
                  <span className="metric-sub">dari total {metrics.kuota} kursi</span>
                </div>

                {/* Sisa Kuota */}
                <div className="metric-card" style={{ borderTop: '3px solid #38bdf8' }}>
                  <div className="metric-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                    <Ticket size={22} />
                  </div>
                  <span className="metric-label">Sisa Kuota</span>
                  <div className="metric-value" style={{ color: metrics.sisa === 0 ? '#f43f5e' : '#38bdf8' }}>
                    {metrics.sisa}
                  </div>
                  <span className="metric-sub">{metrics.sisa === 0 ? '⛔ Kuota Habis' : '⚡ Kursi Tersedia'}</span>
                </div>

                {/* Pendapatan Lunas + Hadir */}
                <div className="metric-card" style={{ borderTop: '3px solid #34d399' }}>
                  <div className="metric-icon-wrap" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                    <DollarSign size={22} />
                  </div>
                  <span className="metric-label">Pendapatan Riil</span>
                  <div className="metric-value" style={{ color: '#34d399', fontSize: '1.45rem' }}>
                    {formatRupiah(metrics.pendapatan)}
                  </div>
                  <span className="metric-sub">Tiket Lunas & Hadir</span>
                </div>

                {/* Jumlah Hadir */}
                <div className="metric-card" style={{ borderTop: '3px solid #f472b6' }}>
                  <div className="metric-icon-wrap" style={{ background: 'rgba(244, 114, 182, 0.2)', color: '#f472b6' }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <span className="metric-label">Peserta Hadir</span>
                  <div className="metric-value" style={{ color: '#f472b6' }}>
                    {metrics.hadir}
                  </div>
                  <span className="metric-sub">Telah Check-in di Venue</span>
                </div>
              </div>

              {/* Progress Bar Okupansi */}
              <div className="card" style={{ marginBottom: 26, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Percent size={20} color="#a855f7" />
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>
                      Tingkat Keterisian Kuota (Okupansi)
                    </span>
                  </div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', textShadow: '0 0 12px rgba(56, 189, 248, 0.5)' }}>
                    {metrics.persentase}%
                  </span>
                </div>
                <div className="quota-bar-wrapper" style={{ height: 16 }}>
                  <div
                    className={`quota-bar-fill ${metrics.sisa === 0 ? 'full' : ''}`}
                    style={{ width: `${metrics.persentase}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  <span>0 Kursi Terisi</span>
                  <span>Kapasitas Maksimal: <strong style={{ color: 'white' }}>{metrics.kuota} Kursi</strong></span>
                </div>
              </div>

              {/* Tiket Breakdown List */}
              <div style={{ marginTop: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award size={20} color="#fbbf24" />
                    Rincian Transaksi Tiket ({tickets.length} Pembelian)
                  </h3>
                </div>

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
                        style={{ padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white' }}>{t.nama_pembeli}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {t.pembeli_id} • <strong style={{ color: '#38bdf8' }}>{t.jumlah_tiket} tiket</strong> ({formatRupiah(t.total)})
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
