import React from 'react';
import { Calendar, Users, Ticket, BarChart3, Database, Sparkles } from 'lucide-react';
import { isFirebaseLive } from '../firebase/config';

export const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  eventCount = 0, 
  pembeliCount = 0, 
  tiketCount = 0,
  onOpenConfig,
  onOpenRulesTest
}) => {
  const tabs = [
    { id: 'event', label: 'Event', icon: Calendar, count: eventCount },
    { id: 'pembeli', label: 'Pembeli', icon: Users, count: pembeliCount },
    { id: 'tiket', label: 'Tiket', icon: Ticket, count: tiketCount },
    { id: 'rekap', label: 'Rekap', icon: BarChart3 }
  ];

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-logo">
          <div className="brand-icon">
            <Ticket size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-name">Karsa Tiket</div>
            <div className="brand-tagline">Tiketing Event Komunitas</div>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className={`status-badge ${isFirebaseLive ? 'live' : 'demo'}`}
            onClick={onOpenConfig}
            title="Klik untuk mengatur Firebase atau Demo Mode"
          >
            <span className={`status-dot ${isFirebaseLive ? 'live' : 'demo'}`}></span>
            <span>{isFirebaseLive ? 'Firestore Live' : 'Mode Demo'}</span>
          </button>
        </div>
      </div>

      <nav className="nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="nav-badge">{tab.count}</span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
