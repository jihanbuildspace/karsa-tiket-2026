import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = ({ 
  isOpen, 
  title = 'Konfirmasi Aksi', 
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?', 
  confirmLabel = 'Ya, Hapus', 
  cancelLabel = 'Batal', 
  isDanger = true,
  isLoading = false,
  onConfirm, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDanger && (
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                background: 'var(--danger-bg)', 
                color: 'var(--danger)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <AlertTriangle size={18} />
              </div>
            )}
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="btn-icon-only" 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {message}
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button 
            type="button" 
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'} btn-sm`} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
