import { useRef, useState } from 'react';
import { api } from './api';

interface Extracted {
  platform: string | null;
  guest_name: string | null;
  checkin: string | null;
  checkout: string | null;
  payout_amount: number | null;
  confirmation_code: string | null;
}

interface UploadResult {
  extracted: Extracted;
  matched: boolean;
  reservation_id: number | null;
}

export function ScreenshotTab({ token }: { token: string }) {
  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState<string>('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<UploadResult | null>(null);
  const [error, setError]       = useState('');
  const inputRef                = useRef<HTMLInputElement>(null);

  const onFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/screenshot-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || res.statusText);
      }
      const data: UploadResult = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: string | number | null) => v != null ? String(v) : '—';

  return (
    <div>
      <h1>Screenshot Import</h1>
      <p style={{ color: '#5a8a90', marginBottom: 24 }}>
        Upload an Airbnb or VRBO booking/payout screenshot. Claude will extract guest details
        and payout amounts and save them to your reservations and financials.
      </p>

      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed #6baeb6', borderRadius: 12, padding: '40px 24px',
          textAlign: 'center', cursor: 'pointer', background: '#f5fafa', marginBottom: 20,
          transition: 'background .15s',
        }}
      >
        {preview
          ? <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 8 }} />
          : <span style={{ color: '#6baeb6', fontSize: 15 }}>Drop a screenshot here or click to browse</span>
        }
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </div>

      {file && (
        <button className="btn" onClick={upload} disabled={loading} style={{ minWidth: 160 }}>
          {loading ? 'Extracting…' : 'Extract & Save'}
        </button>
      )}

      {error && (
        <div style={{ marginTop: 16, color: '#c0392b', background: '#fff5f5', borderRadius: 8, padding: '12px 16px' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <h2 style={{ marginBottom: 12 }}>
            {result.matched
              ? `✓ Matched reservation #${result.reservation_id}`
              : result.reservation_id
              ? `✓ Created new reservation #${result.reservation_id}`
              : '⚠ No matching reservation found — check dates/platform'}
          </h2>
          <table className="admin-table">
            <thead><tr><th>Field</th><th>Extracted Value</th></tr></thead>
            <tbody>
              <tr><td>Platform</td><td>{fmt(result.extracted.platform)}</td></tr>
              <tr><td>Guest name</td><td>{fmt(result.extracted.guest_name)}</td></tr>
              <tr><td>Check-in</td><td>{fmt(result.extracted.checkin)}</td></tr>
              <tr><td>Check-out</td><td>{fmt(result.extracted.checkout)}</td></tr>
              <tr><td>Payout</td><td>{result.extracted.payout_amount != null ? `$${result.extracted.payout_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</td></tr>
              <tr><td>Confirmation code</td><td>{fmt(result.extracted.confirmation_code)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
