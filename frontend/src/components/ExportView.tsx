import React from 'react';

interface Props {
  count: number;
  onDownload: () => void;
  onStartOver: () => void;
}

export const ExportView: React.FC<Props> = ({ count, onDownload, onStartOver }) => {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
      <div style={{ fontSize: 'clamp(20px, 6vw, 26px)', fontWeight: 800, marginBottom: 8 }}>
        Excel File Ready!
      </div>
      <div style={{ fontSize: 15, color: '#666', marginBottom: 32 }}>
        {count} cheque{count !== 1 ? 's' : ''} exported successfully
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
        <button onClick={onDownload} style={{ padding: '16px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(102,126,234,0.3)' }}>
          ⬇ Download .xlsx
        </button>
        <button onClick={onStartOver} style={{ padding: '14px 28px', borderRadius: 12, border: '2px solid #e0e0e0', background: 'white', color: '#333', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          🔄 Scan More Cheques
        </button>
      </div>
    </div>
  );
};
