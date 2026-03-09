import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { QRCodeItem, QRCategory } from '../types';
import { getQRCodes, getQRCodeDetail, deleteQRCode } from '../api/qrcodeApi';
import { useAuth } from '../contexts/AuthContext';

export function QRCodeGalleryPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<QRCategory | ''>('');
  const [selectedQR, setSelectedQR] = useState<QRCodeItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadQRCodes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;
      const data = await getQRCodes(params);
      setQrCodes(data);
    } catch {
      setError('Failed to load QR codes.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    loadQRCodes();
  }, [loadQRCodes]);

  const handleViewDetail = async (uuid: string) => {
    setDetailLoading(true);
    try {
      const detail = await getQRCodeDetail(uuid);
      setSelectedQR(detail);
    } catch {
      setError('Failed to load QR code details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this QR code?')) return;
    try {
      await deleteQRCode(uuid);
      setSelectedQR(null);
      await loadQRCodes();
    } catch {
      setError('Failed to delete QR code.');
    }
  };

  const handlePrint = (qr: QRCodeItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${qr.label || qr.value}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
            img { max-width: 400px; }
            .label { margin-top: 16px; font-size: 18px; font-weight: bold; }
            .value { margin-top: 8px; font-size: 14px; color: #666; word-break: break-all; max-width: 400px; text-align: center; }
          </style>
        </head>
        <body>
          <img src="data:image/png;base64,${qr.qr_image_base64}" alt="QR Code" />
          <div class="label">${qr.label || ''}</div>
          <div class="value">${qr.value || ''}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  };

  const handleDownload = (qr: QRCodeItem) => {
    if (!qr.qr_image_base64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qr.qr_image_base64}`;
    link.download = `qr_${qr.label || qr.uuid}.png`;
    link.click();
  };

  return (
    <div className="gallery-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>&#8592; Back</button>
        <h1>QR Code Gallery</h1>
        <div className="scan-header-user">
          <span className="username">{user?.username}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      {error && <div className="error-banner" style={{ margin: '1rem 1.5rem' }}>{error}</div>}

      <div className="gallery-filters">
        <input
          className="search-input"
          placeholder="Search by label or value..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as QRCategory | '')}
        >
          <option value="">All Categories</option>
          <option value="coil">Coil</option>
          <option value="object">Object</option>
          <option value="produced_item">Produced Item</option>
          <option value="custom">Custom</option>
        </select>
        <button className="create-btn" onClick={() => navigate('/generate')}>
          + Generate New
        </button>
      </div>

      {loading ? (
        <p className="loading-text">Loading QR codes...</p>
      ) : qrCodes.length === 0 ? (
        <div className="empty-gallery">
          <p>No QR codes found.</p>
          <button className="create-btn" onClick={() => navigate('/generate')}>
            Generate Your First QR Code
          </button>
        </div>
      ) : (
        <div className="gallery-grid">
          {qrCodes.map((qr) => (
            <div key={qr.uuid} className="gallery-card" onClick={() => handleViewDetail(qr.uuid)}>
              <div className="gallery-card-header">
                <span className={`category-tag cat-${qr.category}`}>{qr.category.replace('_', ' ')}</span>
              </div>
              <div className="gallery-card-body">
                <p className="gallery-label">{qr.label || qr.value}</p>
                <p className="gallery-value">{qr.value}</p>
              </div>
              <div className="gallery-card-footer">
                <span className="gallery-date">{new Date(qr.created_at).toLocaleDateString()}</span>
                <span className="gallery-author">{qr.created_by_username}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {(selectedQR || detailLoading) && (
        <div className="modal-overlay" onClick={() => setSelectedQR(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <p className="loading-text">Loading...</p>
            ) : selectedQR && (
              <>
                <button className="modal-close" onClick={() => setSelectedQR(null)}>&#10005;</button>
                <div className="modal-qr-image">
                  {selectedQR.qr_image_base64 && (
                    <img
                      src={`data:image/png;base64,${selectedQR.qr_image_base64}`}
                      alt="QR Code"
                    />
                  )}
                </div>
                <h3>{selectedQR.label || 'Untitled'}</h3>
                <p className="modal-value">{selectedQR.value}</p>
                <div className="modal-meta">
                  <span className={`category-tag cat-${selectedQR.category}`}>
                    {selectedQR.category.replace('_', ' ')}
                  </span>
                  <span>by {selectedQR.created_by_username}</span>
                  <span>{new Date(selectedQR.created_at).toLocaleString()}</span>
                </div>
                <div className="modal-actions">
                  <button className="btn-print" onClick={() => handlePrint(selectedQR)}>Print</button>
                  <button className="btn-download" onClick={() => handleDownload(selectedQR)}>Download</button>
                  {(user?.role === 'admin' || user?.role === 'generator') && (
                    <button className="btn-delete" onClick={() => handleDelete(selectedQR.uuid)}>Delete</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
