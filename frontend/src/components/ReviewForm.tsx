import React, { useState } from 'react';
import { ExtractedResult, BatchEntry } from '../types/cheque';

interface Props {
  result: ExtractedResult;
  imageSrc: string;
  onAddToBatch: (entry: BatchEntry) => void;
  onExport: () => void;
  onBack: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  date: 'Date',
  ref: 'Ref',
  chqNo: 'Chq No',
  prj: 'Prj',
  credit: 'Credit',
  debit: 'Debit',
  bal: 'Bal'
};

export const ReviewForm: React.FC<Props> = ({ result, imageSrc, onAddToBatch, onExport, onBack }) => {
  const [editedData, setEditedData] = useState<Record<string, string>>({
    date: result.date,
    ref: result.ref,
    chqNo: result.chqNo,
    prj: result.prj,
    credit: result.credit,
    debit: result.debit,
    bal: result.bal
  });
  const [showImage, setShowImage] = useState(false);

  const handleChange = (field: string, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddToBatch = () => {
    const entry: BatchEntry = {
      ...result,
      ...editedData,
      id: Date.now(),
      status: result.overallConfidence >= 80 && result.amountMatch ? 'Verified' : 'Needs Review',
      scannedAt: new Date().toLocaleString(),
      imageSrc
    };
    onAddToBatch(entry);
  };

  const getConfidenceClass = (score: number) => {
    if (score >= 85) return { bg: '#e8f5e9', color: '#2e7d32' };
    if (score >= 70) return { bg: '#fff3e0', color: '#ef6c00' };
    return { bg: '#ffebee', color: '#c62828' };
  };

  const overallStyle = getConfidenceClass(result.overallConfidence);

  return (
    <div>
      <button onClick={() => setShowImage(!showImage)} style={{
        width: '100%', padding: '12px', marginBottom: 12, borderRadius: 10, border: '1px solid #e0e0e0',
        background: '#f8f9fa', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
      }}>
        {showImage ? '📷 Hide Original Image' : '📷 Show Original Image'}
      </button>

      {showImage && (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '2px solid #e0e0e0', marginBottom: 16 }}>
          <img src={imageSrc} alt="Cheque" style={{ width: '100%', display: 'block' }} />
        </div>
      )}

      <div style={{ display: 'inline-block', marginBottom: 16, padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 700, background: overallStyle.bg, color: overallStyle.color }}>
        Confidence: {result.overallConfidence}%
      </div>

      {!result.amountMatch && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#ffebee', color: '#c62828', borderRadius: 10, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span>
          <span>Row should have either a Credit or a Debit amount, not both (or neither). Please verify.</span>
        </div>
      )}

      <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
        🤖 Processed by {result.ocrEngine} in {result.processingTime}ms
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Extracted Data
        <span style={{ fontSize: 12, fontWeight: 400, color: '#888', marginLeft: 8, display: 'block', marginTop: 4 }}>
          Tap any field to edit
        </span>
      </h3>

      {Object.entries(FIELD_LABELS).map(([field, label]) => {
        const conf = (result.confidence as unknown as Record<string, number>)[field] || 0;
        const confStyle = getConfidenceClass(conf);

        return (
          <div key={field} style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              {label}
              {conf < 70 && <span style={{ color: '#c62828' }}>⚠️</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={editedData[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                style={{ width: '100%', padding: '12px 50px 12px 12px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 16, fontFamily: 'inherit', height: 48 }}
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: confStyle.bg, color: confStyle.color }}>
                {conf}%
              </span>
            </div>
          </div>
        );
      })}

      <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, background: 'white', padding: '12px 0', borderTop: '1px solid #e0e0e0', marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ flex: 1, minWidth: 80, padding: '14px', borderRadius: 10, border: 'none', background: '#f0f0f0', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>← Back</button>
        <button onClick={handleAddToBatch} style={{ flex: 2, minWidth: 120, padding: '14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>+ Add to Batch</button>
        <button onClick={onExport} style={{ flex: 2, minWidth: 120, padding: '14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #11998e, #38ef7d)', color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>📊 Export</button>
      </div>
    </div>
  );
};
