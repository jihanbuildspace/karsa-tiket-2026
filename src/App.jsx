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

      {/* Floating Bottom Quick Bar for Security Rules Test & Config */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        display: 'flex',
        gap: 8,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: '6px 12px',
        borderRadius: 'var(--radius-full)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button
          type="button"
          onClick={() => setIsRulesTestOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#a5b4fc',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
        >
          🛡️ Lembar Uji Mandiri Rules
        </button>
        <span style={{ color: 'rgba(255,255,255,0.2)', alignSelf: 'center' }}>|</span>
        <button
          type="button"
          onClick={() => setIsConfigOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#93c5fd',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
        >
          ⚙️ Atur Firebase / Demo
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
