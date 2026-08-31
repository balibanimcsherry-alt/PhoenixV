import { useRef, useState } from 'react';

interface ImportRecord {
  platform: string | null;
  guest_name: string | null;
  checkin: string | null;
  checkout: string | null;
  payout_amount: number | null;
  confirmation_code: string | null;
  status: 'created' | 'updated' | 'duplicate' | 'skipped';
  reservation_id: number | null;
}

interface ImportResult {
  records: ImportRecord[];
  total: number;
  saved: number;
}

const STATUS_COLOR: Record<string, string> = {
  created:   '#28704e',
  updated:   '#0d5f6b',
  duplicate: '#888',
  skipped:   '#c0392b',
};
const STATUS_LABEL: Record<string, string> = {
  created:   '✓ Created',
  updated:   '✓ Updated',
  duplicate: '— Duplicate',
  skipped:   '✕ Skipped',
};

export function ScreenshotTab({ token }: { token: string }) {
  const [mode, setMode]         = useState<'file'|'text'>('file');
  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState('');
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ImportResult | null>(null);
  const [error, setError]       = useState('');
  const inputRef                = useRef<HTMLInputElement>(null);

  const onFile = (f: File) => {
    setFile(f); setResult(null); setError('');
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview('');
    }
  };

  const submit = async () => {
    if (mode === 'file' && !file) return;
    if (mode === 'text' && !pasteText.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const form = new FormData();
      if (mode === 'file' && file) form.append('file', file);
      if (mode === 'text') form.append('raw_text', pasteText);
      const res = await fetch('/api/admin/import-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || res.statusText);
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: string | number | null) => v != null ? String(v) : '—';
  const fmtPayout = (v: number | null) =>
    v != null ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

  return (
    <div>
      <h1>Import Data</h1>
      <p style={{ color: '#5a8a90', marginBottom: 20 }}>
        Upload a screenshot, CSV, XLSX, TXT, or paste raw text from Airbnb / VRBO.
        Claude extracts bookings and payouts and saves them automatically.
      </p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn${mode==='file'?'':' light'}`} style={{ padding: '7px 18px', fontSize: 13 }} onClick={() => setMode('file')}>
          File upload
        </button>
        <button className={`btn${mode==='text'?'':' light'}`} style={{ padding: '7px 18px', fontSize: 13 }} onClick={() => setMode('text')}>
          Paste text
        </button>
      </div>

      {mode === 'file' && (
        <>
          <div
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            style={{
              border: '2px dashed #6baeb6', borderRadius: 12, padding: '36px 24px',
              textAlign: 'center', cursor: 'pointer', background: '#f5fafa', marginBottom: 16,
            }}
          >
            {preview
              ? <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} />
              : file
              ? <span style={{ color: '#0d5f6b', fontWeight: 600, fontSize: 15 }}>{file.name}</span>
              : <span style={{ color: '#6baeb6', fontSize: 14 }}>
                  Drop a file here or click to browse<br />
                  <span style={{ fontSize: 12, color: '#9bbfc4' }}>PNG · JPG · CSV · XLSX · TXT</span>
                </span>
            }
            <input ref={inputRef} type="file"
              accept="image/*,.csv,.xlsx,.xls,.txt,text/plain,text/csv"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          </div>
          <button className="btn" onClick={submit} disabled={!file || loading} style={{ minWidth: 160 }}>
            {loading ? 'Extracting…' : 'Extract & Save'}
          </button>
        </>
      )}

      {mode === 'text' && (
        <>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder={`Paste raw text from Airbnb/VRBO — e.g. a copied reservation table, email body, or CSV content.\n\nExample:\nHMXXXXXXXX, John Smith, 2025-09-04, 2025-09-07, $450.00`}
            style={{
              width: '100%', minHeight: 200, padding: 14, borderRadius: 10,
              border: '1.5px solid #c5dde0', fontFamily: 'monospace', fontSize: 13,
              resize: 'vertical', boxSizing: 'border-box', marginBottom: 16,
            }}
          />
          <button className="btn" onClick={submit} disabled={!pasteText.trim() || loading} style={{ minWidth: 160 }}>
            {loading ? 'Extracting…' : 'Extract & Save'}
          </button>
        </>
      )}

      {error && (
        <div style={{ marginTop: 16, color: '#c0392b', background: '#fff5f5', borderRadius: 8, padding: '12px 16px' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <h2 style={{ marginBottom: 12 }}>
            {result.saved > 0
              ? `✓ ${result.saved} record${result.saved !== 1 ? 's' : ''} saved`
              : '⚠ No new records saved'}
            <span style={{ fontWeight: 400, fontSize: 14, color: '#888', marginLeft: 10 }}>
              ({result.total} extracted)
            </span>
          </h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Status</th><th>Platform</th><th>Guest</th>
                <th>Check-in</th><th>Check-out</th><th>Payout</th><th>Code</th>
              </tr>
            </thead>
            <tbody>
              {result.records.map((r, i) => (
                <tr key={i}>
                  <td>
                    <span style={{ color: STATUS_COLOR[r.status] || '#888', fontWeight: 600 }}>
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </td>
                  <td>{fmt(r.platform)}</td>
                  <td>{fmt(r.guest_name)}</td>
                  <td>{fmt(r.checkin)}</td>
                  <td>{fmt(r.checkout)}</td>
                  <td>{fmtPayout(r.payout_amount)}</td>
                  <td style={{ fontSize: 12, color: '#666' }}>{fmt(r.confirmation_code)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
