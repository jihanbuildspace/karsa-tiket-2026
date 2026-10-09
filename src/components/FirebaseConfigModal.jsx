import React, { useState } from 'react';
import { Database, X, Check, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { getStoredFirebaseConfig, saveFirebaseConfig, resetLocalDB, isFirebaseLive } from '../firebase/config';
import { useToast } from './Toast';

export const FirebaseConfigModal = ({ isOpen, onClose, onOpenRulesTest }) => {
  const { showToast } = useToast();
  const currentConfig = getStoredFirebaseConfig() || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };

  const [formData, setFormData] = useState(currentConfig);
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState('fields'); // 'fields' | 'json'

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleJsonPaste = (e) => {
    const text = e.target.value;
    setJsonInput(text);
    try {
      // Clean up common JS object syntax (if user copies from firebase console)
      let cleaned = text.trim();
      if (cleaned.startsWith('const firebaseConfig =')) {
        cleaned = cleaned.replace(/const firebaseConfig =\s*/, '').replace(/;\s*$/, '');
      }
      // Replace unquoted keys
      cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      // Replace single quotes
      cleaned = cleaned.replace(/'/g, '"');
      const parsed = JSON.parse(cleaned);
      if (parsed.projectId) {
        setFormData({
          apiKey: parsed.apiKey || '',
          authDomain: parsed.authDomain || '',
          projectId: parsed.projectId || '',
          storageBucket: parsed.storageBucket || '',
          messagingSenderId: parsed.messagingSenderId || '',
          appId: parsed.appId || ''
        });
        showToast('Konfigurasi Firebase berhasil diekstrak!', 'success');
      }
    } catch (err) {
      // Let user continue typing
    }
  };

  const handleSave = () => {
    if (!formData.projectId || !formData.apiKey) {
      showToast('Project ID dan API Key wajib diisi untuk koneksi Firebase!', 'error');
      return;
    }
    saveFirebaseConfig(formData);
    showToast('Konfigurasi Firebase disimpan! Memuat ulang aplikasi...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleUseDemo = () => {
    saveFirebaseConfig(null);
    showToast('Beralih ke Mode Demo (Local Storage). Memuat ulang...', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleResetData = () => {
    resetLocalDB();
    showToast('Data contoh berhasil di-reset sesuai skema!', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: isFirebaseLive ? 'var(--success-bg)' : 'var(--warning-bg)',
              color: isFirebaseLive ? 'var(--success-text)' : 'var(--warning-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Pengaturan Basis Data</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Status: {isFirebaseLive ? '🔥 Terhubung ke Cloud Firestore' : '⚡ Mode Demo / Lokal (Offline Ready)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-only" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === 'fields' ? 'active' : ''}`}
              onClick={() => setActiveTab('fields')}
              style={{ flex: 1 }}
            >
              Isi Form Konfigurasi
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
              style={{ flex: 1 }}
            >
              Tempel Kode JSON
            </button>
          </div>

          {activeTab === 'json' ? (
            <div className="form-group">
              <label className="form-label">
                Tempel Objek firebaseConfig dari Konsol Firebase
              </label>
              <textarea
                rows={6}
                className="form-textarea"
                placeholder='const firebaseConfig = { apiKey: "...", projectId: "...", ... };'
                value={jsonInput}
                onChange={handleJsonPaste}
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Project ID</label>
                <input
                  type="text"
                  name="projectId"
                  className="form-input"
                  placeholder="contoh: karsa-tiket-app"
                  value={formData.projectId}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">API Key</label>
                <input
                  type="text"
                  name="apiKey"
                  className="form-input"
                  placeholder="contoh: AIzaSy..."
                  value={formData.apiKey}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Auth Domain</label>
                <input
                  type="text"
                  name="authDomain"
                  className="form-input"
                  placeholder="contoh: karsa-tiket-app.firebaseapp.com"
                  value={formData.authDomain}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">App ID</label>
                <input
                  type="text"
                  name="appId"
                  className="form-input"
                  placeholder="contoh: 1:123456789:web:abcdef"
                  value={formData.appId}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div style={{
            background: 'var(--bg-main)',
            padding: 12,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tools Pengujian:</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onOpenRulesTest();
                }}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <ShieldCheck size={14} />
                Lembar Uji Mandiri Rules
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reset Data Contoh (Skema):</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetData}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <RefreshCw size={14} />
                Reset Data Skema
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleUseDemo}
          >
            Gunakan Mode Demo
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Tutup
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
              <Check size={16} />
              Simpan & Hubungkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
