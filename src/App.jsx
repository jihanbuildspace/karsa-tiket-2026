import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { EventPage } from './pages/EventPage';
import { PembeliPage } from './pages/PembeliPage';
import { TiketPage } from './pages/TiketPage';
import { RekapPage } from './pages/RekapPage';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { RulesTestModal } from './components/RulesTestModal';
import { eventService } from './services/eventService';
import { pembeliService } from './services/pembeliService';
import { tiketService } from './services/tiketService';
import { Sparkles, Calendar, Users, Ticket, ShieldCheck, Settings } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('event');
  const [eventCount, setEventCount] = useState(0);
  const [pembeliCount, setPembeliCount] = useState(0);
  const [tiketCount, setTiketCount] = useState(0);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isRulesTestOpen, setIsRulesTestOpen] = useState(false);

  const refreshCounts = async () => {
    try {
      const [events, buyers, tickets] = await Promise.all([
        eventService.getEvents().catch(() => []),
        pembeliService.getPembeli().catch(() => []),
        tiketService.getTiket().catch(() => [])
      ]);
      setEventCount(events.length);
      setPembeliCount(buyers.length);
      setTiketCount(tickets.length);
    } catch (e) {
      console.warn('Error fetching counts:', e);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, [activeTab]);

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        eventCount={eventCount}
        pembeliCount={pembeliCount}
        tiketCount={tiketCount}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenRulesTest={() => setIsRulesTestOpen(true)}
      />

      <main className="main-content">
        {/* Dynamic Hero Banner */}
        <div className="hero-banner">
          <div className="hero-content">
            <h2>✨ Karsa Tiket Dashboard</h2>
            <p>Kelola event, transaksi tiket, dan pantau kehadiran komunitas secara real-time.</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-pill">
              <Calendar size={15} />
              <span>{eventCount} Event</span>
            </div>
            <div className="hero-stat-pill">
              <Users size={15} />
              <span>{pembeliCount} Kontak</span>
            </div>
            <div className="hero-stat-pill">
              <Ticket size={15} />
              <span>{tiketCount} Tiket</span>
            </div>
          </div>
        </div>

        {activeTab === 'event' && (
          <EventPage onDataChange={(count) => { setEventCount(count); refreshCounts(); }} />
        )}
        {activeTab === 'pembeli' && (
          <PembeliPage onDataChange={(count) => { setPembeliCount(count); refreshCounts(); }} />
        )}
        {activeTab === 'tiket' && (
          <TiketPage onDataChange={(count) => { setTiketCount(count); refreshCounts(); }} />
        )}
        {activeTab === 'rekap' && (
          <RekapPage />
        )}
      </main>

      {/* Floating Bottom Quick Bar */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        display: 'flex',
        gap: 8,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        padding: '8px 16px',
        borderRadius: 'var(--radius-full)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.15)'
      }}>
        <button
          type="button"
          onClick={() => setIsRulesTestOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#a5b4fc',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <ShieldCheck size={16} />
          <span>Lembar Uji Rules</span>
        </button>
        <span style={{ color: 'rgba(255,255,255,0.2)', alignSelf: 'center' }}>|</span>
        <button
          type="button"
          onClick={() => setIsConfigOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#93c5fd',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Settings size={16} />
          <span>Atur Database</span>
        </button>
      </div>

      {/* Modals */}
      <FirebaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onOpenRulesTest={() => setIsRulesTestOpen(true)}
      />

      <RulesTestModal
        isOpen={isRulesTestOpen}
        onClose={() => setIsRulesTestOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
