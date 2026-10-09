import React from 'react';
import { Inbox, AlertCircle, RefreshCw, Plus } from 'lucide-react';

export const LoadingState = ({ count = 3, message = 'Memuat data...' }) => {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <RefreshCw size={16} className="animate-spin" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} />
        {message}
      </div>
      <div className="card-grid">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton-card">
            <div className="skeleton-line" style={{ width: '65%', height: 20, marginBottom: 12 }}></div>
            <div className="skeleton-line" style={{ width: '45%', marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ width: '80%', marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ width: '35%', marginTop: 14 }}></div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const EmptyState = ({ 
  title = 'Belum Ada Data', 
  description = 'Data belum tersedia di sistem.', 
  actionLabel, 
  onAction,
  icon: Icon = Inbox 
}) => {
  return (
    <div className="state-container">
      <div className="state-icon-wrap empty">
        <Icon size={32} />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-desc">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const ErrorState = ({ 
  title = 'Gagal Memuat Data', 
  description = 'Terjadi kesalahan saat memproses data. Silakan periksa koneksi internet Anda.', 
  onRetry 
}) => {
  return (
    <div className="state-container" style={{ borderColor: 'var(--danger-border)' }}>
      <div className="state-icon-wrap error">
        <AlertCircle size={32} />
      </div>
      <h3 className="state-title" style={{ color: 'var(--danger)' }}>{title}</h3>
      <p className="state-desc">{description}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <RefreshCw size={16} />
          Coba Lagi
        </button>
      )}
    </div>
  );
};
