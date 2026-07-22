import React, { useState, useCallback } from 'react';
import { BatchEntry, ExtractedResult } from './types/cheque';
import { ImageUploader } from './components/ImageUploader';
import { ProcessingView } from './components/ProcessingView';
import { ReviewForm } from './components/ReviewForm';
import { BatchTable } from './components/BatchTable';
import { ExportView } from './components/ExportView';
import { useCamera } from './hooks/useCamera';
import { useClaudeOCR } from './hooks/useClaudeOCR';
import { useExcelExport } from './hooks/useExcelExport';

type Step = 'capture' | 'camera' | 'preview' | 'processing' | 'review' | 'export';
type Mode = 'single' | 'batch';

function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('capture');
  const [mode, setMode] = useState<Mode>('single');
  const [currentImage, setCurrentImage] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [batchData, setBatchData] = useState<BatchEntry[]>([]);
  const [pendingBatch, setPendingBatch] = useState<ExtractedResult[]>([]);

  const { videoRef, openCamera, closeCamera, capturePhoto } = useCamera();
  const { progress, status, subStatus, result, error, batchProgress, processImage, processBatch, reset: resetOCR } = useClaudeOCR();
  const { exportBatch, reset: resetExport } = useExcelExport();

  // Single image handlers
  const handleCameraCapture = useCallback((imageSrc: string) => {
    setCurrentImage(imageSrc);
    const file = dataURLtoFile(imageSrc, `cheque_${Date.now()}.jpg`);
    setCurrentFile(file);
    setMode('single');
    setStep('preview');
  }, []);

  const handleFileSelect = useCallback((imageSrc: string, file: File) => {
    setCurrentImage(imageSrc);
    setCurrentFile(file);
    setMode('single');
    setStep('preview');
  }, []);

  // Batch handlers - select multiple files
  const handleBatchSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    if (files.length === 1) {
      // Single file - treat as normal
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) handleFileSelect(result, files[0]);
      };
      reader.readAsDataURL(files[0]);
      return;
    }

    // Multiple files - batch mode
    setMode('batch');
    setStep('processing');

    const results = await processBatch(files);

    if (results.length > 0) {
      setPendingBatch(results);
      setStep('review');
    } else {
      setStep('capture');
      alert('Failed to process any cheques. Please try again.');
    }
  }, [processBatch, handleFileSelect]);

  const handleProcess = useCallback(async () => {
    if (!currentFile) return;
    setStep('processing');
    const extracted = await processImage(currentFile);
    if (extracted) {
      setStep('review');
    } else {
      setStep('preview');
    }
  }, [currentFile, processImage]);

  const handleAddToBatch = useCallback((entry: BatchEntry) => {
    setBatchData(prev => [...prev, entry]);
    setStep('capture');
    setCurrentImage('');
    setCurrentFile(null);
    resetOCR();
  }, [resetOCR]);

  // Add all batch results at once
  const handleAddAllBatch = useCallback(() => {
    const newEntries: BatchEntry[] = pendingBatch.map((result, idx) => ({
      ...result,
      id: Date.now() + idx,
      status: result.overallConfidence >= 80 && result.amountMatch ? 'Verified' : 'Needs Review',
      scannedAt: new Date().toLocaleString(),
      imageSrc: '' // No individual image for batch
    }));

    setBatchData(prev => [...prev, ...newEntries]);
    setPendingBatch([]);
    setStep('capture');
    resetOCR();
  }, [pendingBatch, resetOCR]);

  const handleExport = useCallback(() => {
    if (batchData.length === 0 && result) {
      const entry: BatchEntry = {
        ...result,
        id: Date.now(),
        status: result.overallConfidence >= 80 && result.amountMatch ? 'Verified' : 'Needs Review',
        scannedAt: new Date().toLocaleString(),
        imageSrc: currentImage
      };
      setBatchData(prev => [...prev, entry]);
    }
    setStep('export');
  }, [batchData.length, result, currentImage]);

  const handleDownload = useCallback(() => {
    exportBatch(batchData);
  }, [batchData, exportBatch]);

  const handleStartOver = useCallback(() => {
    setBatchData([]);
    setPendingBatch([]);
    setCurrentImage('');
    setCurrentFile(null);
    setStep('capture');
    resetOCR();
    resetExport();
  }, [resetOCR, resetExport]);

  const handleRemoveFromBatch = useCallback((id: number) => {
    setBatchData(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleOpenCamera = useCallback(() => {
    setMode('single');
    setStep('camera');
    openCamera();
  }, [openCamera]);

  const handleCancelCamera = useCallback(() => {
    closeCamera();
    setStep('capture');
  }, [closeCamera]);

  const handleCaptureFromCamera = useCallback(() => {
    const photo = capturePhoto();
    if (photo) {
      handleCameraCapture(photo);
    }
  }, [capturePhoto, handleCameraCapture]);

  const handleBackToCapture = useCallback(() => {
    setStep('capture');
    setCurrentImage('');
    setCurrentFile(null);
    setPendingBatch([]);
    resetOCR();
  }, [resetOCR]);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      maxWidth: 900,
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1a1a2e',
      background: '#ffffff',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px 16px',
      textAlign: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    },
    logo: {
      fontSize: 'clamp(20px, 5vw, 28px)',
      fontWeight: 800,
      letterSpacing: -0.5
    },
    subtitle: {
      fontSize: 'clamp(12px, 3vw, 14px)',
      opacity: 0.85,
      marginTop: 4
    },
    content: {
      padding: '16px',
      flex: 1,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    },
    modeToggle: {
      display: 'flex',
      gap: 8,
      marginBottom: 16
    },
    modeButtonActive: {
      flex: 1,
      padding: '12px',
      borderRadius: 10,
      border: 'none',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer'
    },
    modeButtonInactive: {
      flex: 1,
      padding: '12px',
      borderRadius: 10,
      border: 'none',
      background: '#f0f0f0',
      color: '#666',
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>📄 ChequeScan Pro</div>
        <div style={styles.subtitle}>Scan, Extract & Export to Excel</div>
      </div>

      <div style={styles.content}>
        {step === 'capture' && (
          <div>
            {/* Mode Toggle */}
            <div style={styles.modeToggle}>
              <button onClick={() => setMode('single')} style={mode === 'single' ? styles.modeButtonActive : styles.modeButtonInactive}>
                📷 Single Cheque
              </button>
              <button onClick={() => setMode('batch')} style={mode === 'batch' ? styles.modeButtonActive : styles.modeButtonInactive}>
                📚 Cheque Book (Bulk)
              </button>
            </div>

            {mode === 'single' ? (
              <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                <button onClick={handleOpenCamera} style={{
                  padding: '24px 20px', borderRadius: 16, border: '2px dashed #e0e0e0',
                  background: '#f8f9fa', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.3s', touchAction: 'manipulation'
                }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>Use Camera</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Scan one cheque at a time</div>
                </button>
                <ImageUploader onImageSelect={handleFileSelect} />
              </div>
            ) : (
              <div>
                <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#2e7d32', marginBottom: 8 }}>
                    📚 Bulk Upload Mode
                  </div>
                  <div style={{ fontSize: 14, color: '#555' }}>
                    Select ALL cheque images from your cheque book at once. We'll process them all and create one Excel file.
                  </div>
                </div>
                <ImageUploader 
                  onImageSelect={handleFileSelect} 
                  onBatchSelect={handleBatchSelect}
                  multiple={true}
                />
              </div>
            )}

            {batchData.length > 0 && (
              <div style={{ marginTop: 20, padding: 16, background: '#f8f9fa', borderRadius: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                  📦 Batch: {batchData.length} cheque{batchData.length !== 1 ? 's' : ''}
                </div>
                <button onClick={handleExport} style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                  color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer'
                }}>
                  📊 Export to Excel
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'camera' && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', height: '50%', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 8, zIndex: 10, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: -3, left: -3, width: 28, height: 28, borderTop: '4px solid #00ff88', borderLeft: '4px solid #00ff88' }} />
                <div style={{ position: 'absolute', top: -3, right: -3, width: 28, height: 28, borderTop: '4px solid #00ff88', borderRight: '4px solid #00ff88' }} />
                <div style={{ position: 'absolute', bottom: -3, left: -3, width: 28, height: 28, borderBottom: '4px solid #00ff88', borderLeft: '4px solid #00ff88' }} />
                <div style={{ position: 'absolute', bottom: -3, right: -3, width: 28, height: 28, borderBottom: '4px solid #00ff88', borderRight: '4px solid #00ff88' }} />
                <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: 14, whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.8)', fontWeight: 600 }}>Align cheque within frame</div>
              </div>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ padding: '16px 24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
              <button onClick={handleCancelCamera} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCaptureFromCamera} style={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid white', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'white' }} />
              </button>
              <div style={{ width: 60 }} />
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Preview</h3>
            <div style={{ borderRadius: 12, overflow: 'hidden', background: '#f0f0f0', border: '2px solid #e0e0e0' }}>
              <img src={currentImage} alt="Cheque preview" style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={handleBackToCapture} style={{ flex: 1, padding: '14px', borderRadius: 10, border: 'none', background: '#f0f0f0', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>Retake</button>
              <button onClick={handleProcess} style={{ flex: 2, padding: '14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
                🔍 Extract with AI
              </button>
            </div>
            {error && <p style={{ color: '#c62828', textAlign: 'center', marginTop: 12, fontSize: 14 }}>{error}</p>}
          </div>
        )}

        {step === 'processing' && (
          <ProcessingView 
            progress={progress} 
            status={status} 
            subStatus={subStatus}
            current={batchProgress.current}
            total={batchProgress.total}
          />
        )}

        {step === 'review' && mode === 'batch' && pendingBatch.length > 0 && (
          <div>
            <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2e7d32' }}>
                ✅ {pendingBatch.length} cheques processed!
              </div>
              <div style={{ fontSize: 14, color: '#555', marginTop: 4 }}>
                Review and add all to your batch, or export now.
              </div>
            </div>

            {pendingBatch.map((item, idx) => (
              <div key={idx} style={{ background: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#667eea', marginBottom: 8 }}>Entry #{idx + 1}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <div><strong>Date:</strong> {item.date}</div>
                  <div><strong>Ref:</strong> {item.ref}</div>
                  <div><strong>Chq No:</strong> {item.chqNo}</div>
                  <div><strong>Prj:</strong> {item.prj}</div>
                  <div><strong>Credit:</strong> {item.credit}</div>
                  <div><strong>Debit:</strong> {item.debit}</div>
                  <div><strong>Bal:</strong> {item.bal}</div>
                  <div><strong>Confidence:</strong> {item.overallConfidence}%</div>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={handleBackToCapture} style={{ flex: 1, padding: '14px', borderRadius: 10, border: 'none', background: '#f0f0f0', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>Cancel</button>
              <button onClick={handleAddAllBatch} style={{ flex: 2, padding: '14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
                + Add All to Batch
              </button>
            </div>
          </div>
        )}

        {step === 'review' && mode === 'single' && result && (
          <>
            <ReviewForm
              result={result}
              imageSrc={currentImage}
              onAddToBatch={handleAddToBatch}
              onExport={handleExport}
              onBack={handleBackToCapture}
            />
            <BatchTable batchData={batchData} onRemove={handleRemoveFromBatch} />
          </>
        )}

        {step === 'export' && (
          <ExportView
            count={batchData.length}
            onDownload={handleDownload}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
};

export default App;
