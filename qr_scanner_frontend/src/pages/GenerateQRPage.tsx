import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { QRCodeItem } from '../types';
import { generateQRCode } from '../api/qrcodeApi';
import { useAuth } from '../contexts/AuthContext';

export function GenerateQRPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [value, setValue] = useState('');
  const [keywordInputs, setKeywordInputs] = useState<string[]>(['']);
  const [label, setLabel] = useState('');
  const [generated, setGenerated] = useState<QRCodeItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const updateKeyword = (index: number, val: string) => {
    const updated = [...keywordInputs];
    updated[index] = val;
    setKeywordInputs(updated);
  };

  const addKeywordRow = () => {
    setKeywordInputs([...keywordInputs, '']);
  };

  const removeKeywordRow = (index: number) => {
    if (keywordInputs.length <= 1) {
      setKeywordInputs(['']);
      return;
    }
    setKeywordInputs(keywordInputs.filter((_, i) => i !== index));
  };

  const getMatchKeyValue = () => {
    const keywords = keywordInputs.map((k) => k.trim()).filter(Boolean);
    return keywords.length > 0 ? keywords.join(', ') : value;
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setGenerated(null);
    try {
      const matchKeyValue = getMatchKeyValue();
      const qr = await generateQRCode({ value, match_key: matchKeyValue, label });
      setGenerated(qr);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.response?.data?.match_key?.[0] || JSON.stringify(err?.response?.data) || err.message;
      setError(`Failed to generate QR code: ${detail}`);
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

  const matchKeyValue = getMatchKeyValue();

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

        <div className="generate-layout">
          <form className="generate-form" onSubmit={handleGenerate}>
            <div className="form-group">
              <label>Value (data to encode in QR)</label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g., COIL-4521-BATCH-2024-LOT-A-500KG"
                required
              />
            </div>
            <div className="form-group">
              <label>Match Keywords</label>
              <div className="keyword-rows">
                {keywordInputs.map((kw, i) => (
                  <div key={i} className="keyword-row">
                    <input
                      className="keyword-input"
                      value={kw}
                      onChange={(e) => updateKeyword(i, e.target.value)}
                      placeholder={`Keyword ${i + 1}`}
                    />
                    <button
                      type="button"
                      className="keyword-remove-btn"
                      onClick={() => removeKeywordRow(i)}
                      title="Remove keyword"
                    >
                      &minus;
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="keyword-add-btn"
                onClick={addKeywordRow}
              >
                + Add Keyword
              </button>
              <span className="field-hint">
                When scanning, ALL keywords must be found in QR #2 for a match. Leave empty to use the full value.
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
            <button type="submit" className="login-btn" disabled={loading || !value}>
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </form>

          <div className="preview-section" ref={printRef}>
            <h3>Preview</h3>
            {value ? (
              <div className="qr-preview">
                <QRCodeSVG value={JSON.stringify({ data: value, match: matchKeyValue })} size={200} level="H" />
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
