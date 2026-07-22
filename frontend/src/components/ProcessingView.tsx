import React from 'react';

interface Props {
  progress: number;
  status: string;
  subStatus: string;
  current?: number;
  total?: number;
}

export const ProcessingView: React.FC<Props> = ({ progress, status, subStatus, current, total }) => {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
      <div style={{ fontSize: 'clamp(16px, 5vw, 20px)', fontWeight: 700, marginBottom: 8 }}>{status}</div>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 24, padding: '0 20px' }}>{subStatus}</div>

      {current !== undefined && total !== undefined && total > 1 && (
        <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: '#667eea' }}>
          Cheque {current} of {total}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 340, height: 8, background: '#e0e0e0', borderRadius: 4, margin: '0 auto', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 4, transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: '#999', fontWeight: 600 }}>{progress}%</div>
    </div>
  );
};
