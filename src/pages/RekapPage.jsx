import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle, 
  Layers, 
  TrendingUp,
  Ticket,
  ChevronDown
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

  // Fetch tickets whenever selectedEventId changes
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

  // Calculations per PRD Section 5.4:
  // - Tiket Terjual: from event.tiket_terjual or sum of active tickets
  // - Sisa Kuota: event.kuota - event.tiket_terjual
  // - Pendapatan: calculated ONLY from tickets with status 'lunas' or 'hadir'
  // - Jumlah Hadir: sum of tickets with status 'hadir'
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
          <h1>Rekap Penjualan & Kehadiran</h1>
          <p>Laporan pendapatan riil, sisa kuota kursi, dan kehadiran peserta per event.</p>
        </div>
      </div>

      {loading && <LoadingState message="Memuat ringkasan rekap..." />}

      {!loading && error && (
        <ErrorState description={error} onRetry={fetchEvents} />
      )}

      {!loading && !error && events.length === 0 && (
        <EmptyState
          title="Belum Ada Event"
          description="Tambahkan event terlebih dahulu di menu Event untuk melihat rekapitulasi."
        />
      )}

      {!loading && !error && events.length > 0 && (
        <div>
          {/* Event Selector Dropdown */}
          <div className="card" style={{ marginBottom: 20, padding: 16 }}>
            <label className="form-label" style={{ marginBottom: 8 }}>
              Pilih Acara / Event untuk Ditampilkan:
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="select-rekap-event"
                className="form-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{ fontSize: '1rem', fontWeight: 600, padding: '12px 16px' }}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nama} ({ev.tanggal}) - {ev.harga_tiket === 0 ? 'Gratis' : formatRupiah(ev.harga_tiket)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedEvent && (
            <>
              {/* Metric Cards Grid */}
              <div className="metrics-grid">
                {/* Tiket Terjual */}
                <div className="metric-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label">Tiket Terjual</span>
                    <Layers size={18} color="var(--primary)" />
                  </div>
                  <div className="metric-value" style={{ color: 'var(--primary)' }}>
                    {metrics.terjual}
                  </div>
                  <span className="metric-sub">dari total {metrics.kuota} kursi</span>
                </div>

                {/* Sisa Kuota */}
                <div className="metric-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label">Sisa Kuota</span>
                    <Ticket size={18} color="var(--secondary)" />
                  </div>
                  <div className="metric-value" style={{ color: metrics.sisa === 0 ? 'var(--danger)' : 'var(--text-main)' }}>
                    {metrics.sisa}
                  </div>
                  <span className="metric-sub">{metrics.sisa === 0 ? 'Kuota Habis' : 'Kursi Tersedia'}</span>
                </div>

                {/* Pendapatan Lunas + Hadir */}
                <div className="metric-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label">Pendapatan</span>
                    <DollarSign size={18} color="var(--success)" />
                  </div>
                  <div className="metric-value" style={{ color: 'var(--success)' }}>
                    {formatRupiah(metrics.pendapatan)}
                  </div>
                  <span className="metric-sub">Khusus status Lunas & Hadir</span>
                </div>

                {/* Jumlah Hadir */}
                <div className="metric-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label">Peserta Hadir</span>
                    <CheckCircle size={18} color="#059669" />
                  </div>
                  <div className="metric-value" style={{ color: '#059669' }}>
                    {metrics.hadir}
                  </div>
                  <span className="metric-sub">Sudah check-in di acara</span>
                </div>
              </div>

              {/* Progress Bar Okupansi */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    Tingkat Keterisian Kuota (Okupansi)
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {metrics.persentase}%
                  </span>
                </div>
                <div className="quota-bar-wrapper" style={{ height: 12 }}>
                  <div
                    className={`quota-bar-fill ${metrics.sisa === 0 ? 'full' : ''}`}
                    style={{ width: `${metrics.persentase}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  <span>0 Kursi</span>
                  <span>Target: {metrics.kuota} Kursi</span>
                </div>
              </div>

              {/* Tiket Breakdown List */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>
                  Rincian Transaksi Tiket Event Ini ({tickets.length})
                </h3>

                {ticketsLoading && <LoadingState count={2} message="Memuat rincian transaksi..." />}

                {!ticketsLoading && tickets.length === 0 && (
                  <EmptyState
                    title="Belum Ada Pembelian Tiket"
                    description={`Event "${selectedEvent.nama}" belum memiliki catatan transaksi tiket.`}
                  />
                )}

                {!ticketsLoading && tickets.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tickets.map((t) => (
                      <div 
                        key={t.id} 
                        className="card" 
                        style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.nama_pembeli}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {t.pembeli_id} • {t.jumlah_tiket} tiket ({formatRupiah(t.total)})
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
