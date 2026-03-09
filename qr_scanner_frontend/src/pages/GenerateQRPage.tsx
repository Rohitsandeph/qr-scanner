import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { QRCategory, QRCodeItem } from '../types';
import { generateQRCode, bulkGenerateQRCodes } from '../api/qrcodeApi';
import { useAuth } from '../contexts/AuthContext';

export function GenerateQRPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Single mode
  const [value, setValue] = useState('');
  const [matchKey, setMatchKey] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<QRCategory>('custom');
  const [generated, setGenerated] = useState<QRCodeItem | null>(null);

  // Bulk mode
  const [bulkMode, setBulkMode] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [matchKeyPrefix, setMatchKeyPrefix] = useState('');
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(10);
  const [padding, setPadding] = useState(3);
  const [bulkCount, setBulkCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setGenerated(null);
    try {
      const qr = await generateQRCode({ value, match_key: matchKey || value, label, category });
      setGenerated(qr);
    } catch {
      setError('Failed to generate QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setBulkCount(null);
    try {
      const result = await bulkGenerateQRCodes({ prefix, start, end, padding, category, match_key_prefix: matchKeyPrefix });
      setBulkCount(result.count);
    } catch {
      setError('Failed to bulk generate. Max 500 at a time.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${generated?.label || generated?.value}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
            img { max-width: 400px; }
            .label { margin-top: 16px; font-size: 18px; font-weight: bold; }
            .value { margin-top: 8px; font-size: 14px; color: #666; word-break: break-all; max-width: 400px; text-align: center; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <img src="data:image/png;base64,${generated?.qr_image_base64}" alt="QR Code" />
          <div class="label">${generated?.label || ''}</div>
          <div class="value">${generated?.value || ''}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDownload = () => {
    if (!generated?.qr_image_base64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${generated.qr_image_base64}`;
    link.download = `qr_${generated.label || generated.uuid}.png`;
    link.click();
  };

  return (
    <div className="generate-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>&#8592; Back</button>
        <h1>Generate QR Codes</h1>
        <div className="scan-header-user">
          <span className="username">{user?.username}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="generate-content">
        {error && <div className="error-banner">{error}</div>}

        <div className="mode-toggle">
          <button
            className={`mode-btn ${!bulkMode ? 'active' : ''}`}
            onClick={() => setBulkMode(false)}
          >
            Single
          </button>
          <button
            className={`mode-btn ${bulkMode ? 'active' : ''}`}
            onClick={() => setBulkMode(true)}
          >
            Bulk
          </button>
        </div>

        {!bulkMode ? (
          <div className="generate-layout">
            <form className="generate-form" onSubmit={handleGenerate}>
              <div className="form-group">
                <label>Value (data to encode in QR)</label>
                <input
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (!matchKey) setMatchKey('');
                  }}
                  placeholder="e.g., COIL-4521-BATCH-2024-LOT-A-500KG"
                  required
                />
              </div>
              <div className="form-group">
                <label>Match Key (text to search for when scanning)</label>
                <input
                  value={matchKey}
                  onChange={(e) => setMatchKey(e.target.value)}
                  placeholder={value || 'e.g., COIL-4521'}
                />
                <span className="field-hint">
                  When scanning, this text will be searched in QR #2. Leave empty to use the full value.
                </span>
              </div>
              <div className="form-group">
                <label>Label (optional)</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Coil #4521"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as QRCategory)}>
                  <option value="custom">Custom</option>
                  <option value="coil">Coil</option>
                  <option value="object">Object</option>
                  <option value="produced_item">Produced Item</option>
                </select>
              </div>
              <button type="submit" className="login-btn" disabled={loading || !value}>
                {loading ? 'Generating...' : 'Generate QR Code'}
              </button>
            </form>

            <div className="preview-section" ref={printRef}>
              <h3>Preview</h3>
              {value ? (
                <div className="qr-preview">
                  <QRCodeSVG value={value} size={200} level="H" />
                  {label && <p className="preview-label">{label}</p>}
                  <p className="preview-value">{value}</p>
                </div>
              ) : (
                <div className="preview-placeholder">
                  Enter a value to see preview
                </div>
              )}

              {generated && (
                <div className="generated-actions">
                  <p className="success-msg">QR Code saved successfully!</p>
                  <div className="action-buttons">
                    <button className="btn-print" onClick={handlePrint}>
                      Print
                    </button>
                    <button className="btn-download" onClick={handleDownload}>
                      Download PNG
                    </button>
                    <button className="btn-gallery" onClick={() => navigate('/qrcodes')}>
                      View Gallery
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bulk-section">
            <form className="generate-form" onSubmit={handleBulkGenerate}>
              <div className="form-group">
                <label>Value Prefix</label>
                <input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g., COIL-4521-BATCH-2024-"
                  required
                />
              </div>
              <div className="form-group">
                <label>Match Key Prefix (optional)</label>
                <input
                  value={matchKeyPrefix}
                  onChange={(e) => setMatchKeyPrefix(e.target.value)}
                  placeholder={prefix || 'e.g., COIL-'}
                />
                <span className="field-hint">
                  If different from value prefix. Leave empty to use value as match key.
                </span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Number</label>
                  <input
                    type="number"
                    value={start}
                    onChange={(e) => setStart(Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Number</label>
                  <input
                    type="number"
                    value={end}
                    onChange={(e) => setEnd(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Number Padding (digits)</label>
                  <input
                    type="number"
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    min={1}
                    max={10}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as QRCategory)}>
                    <option value="custom">Custom</option>
                    <option value="coil">Coil</option>
                    <option value="object">Object</option>
                    <option value="produced_item">Produced Item</option>
                  </select>
                </div>
              </div>

              <div className="bulk-preview-text">
                Will generate: <strong>{prefix}{String(start).padStart(padding, '0')}</strong> to <strong>{prefix}{String(end).padStart(padding, '0')}</strong> ({Math.max(0, end - start + 1)} codes)
              </div>

              <button type="submit" className="login-btn" disabled={loading || !prefix}>
                {loading ? 'Generating...' : `Generate ${Math.max(0, end - start + 1)} QR Codes`}
              </button>
            </form>

            {bulkCount !== null && (
              <div className="generated-actions">
                <p className="success-msg">{bulkCount} QR codes generated successfully!</p>
                <div className="action-buttons">
                  <button className="btn-gallery" onClick={() => navigate('/qrcodes')}>
                    View in Gallery
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
