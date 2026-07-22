import React from 'react';
import { BatchEntry } from '../types/cheque';

interface Props {
  batchData: BatchEntry[];
  onRemove: (id: number) => void;
}

export const BatchTable: React.FC<Props> = ({ batchData, onRemove }) => {
  if (batchData.length === 0) return null;

  const totalCredit = batchData.reduce((sum, r) => {
    const amt = parseFloat(r.credit?.replace(/,/g, '')) || 0;
    return sum + amt;
  }, 0);
  const totalDebit = batchData.reduce((sum, r) => {
    const amt = parseFloat(r.debit?.replace(/,/g, '')) || 0;
    return sum + amt;
  }, 0);

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px solid #e0e0e0' }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
        📦 Batch Summary ({batchData.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {batchData.map((item, idx) => (
          <div key={item.id} style={{ background: '#f8f9fa', borderRadius: 12, padding: 16, border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#667eea' }}>#{idx + 1}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: item.status === 'Verified' ? '#e8f5e9' : '#fff3e0', color: item.status === 'Verified' ? '#2e7d32' : '#ef6c00' }}>
                  {item.status}
                </span>
                <button onClick={() => onRemove(item.id)} style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  ✕
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Ref</div>
                <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{item.ref}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Date</div>
                <div>{item.date}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Chq No</div>
                <div>{item.chqNo}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Prj</div>
                <div>{item.prj}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Credit</div>
                <div style={{ fontWeight: 700, color: '#2e7d32' }}>{item.credit}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Debit</div>
                <div style={{ fontWeight: 700, color: '#c62828' }}>{item.debit}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Bal</div>
                <div>{item.bal}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '16px', background: '#1a1a2e', color: 'white', borderRadius: 12, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>
        Total: {batchData.length} entr{batchData.length !== 1 ? 'ies' : 'y'} | Credit: {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Debit: {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
};
