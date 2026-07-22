import React, { useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';

interface Props {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

export const CameraScanner: React.FC<Props> = ({ onCapture, onCancel }) => {
  const { error, videoRef, openCamera, closeCamera, capturePhoto } = useCamera();

  useEffect(() => {
    openCamera();
    return () => { closeCamera(); };
  }, []);

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) onCapture(photo);
  };

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: '#c62828', fontSize: 16 }}>⚠️ {error}</p>
        <button 
          onClick={onCancel}
          style={{ marginTop: 20, padding: '14px 28px', borderRadius: 10, border: 'none', background: '#f0f0f0', fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '100%' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
          width: '90%', height: '50%', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 8, zIndex: 10, pointerEvents: 'none' 
        }}>
          <div style={{ position: 'absolute', top: -3, left: -3, width: 28, height: 28, borderTop: '4px solid #00ff88', borderLeft: '4px solid #00ff88' }} />
          <div style={{ position: 'absolute', top: -3, right: -3, width: 28, height: 28, borderTop: '4px solid #00ff88', borderRight: '4px solid #00ff88' }} />
          <div style={{ position: 'absolute', bottom: -3, left: -3, width: 28, height: 28, borderBottom: '4px solid #00ff88', borderLeft: '4px solid #00ff88' }} />
          <div style={{ position: 'absolute', bottom: -3, right: -3, width: 28, height: 28, borderBottom: '4px solid #00ff88', borderRight: '4px solid #00ff88' }} />
          <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: 14, whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.8)', fontWeight: 600 }}>
            Align cheque within frame
          </div>
        </div>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{ padding: '16px 24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => { closeCamera(); onCancel(); }} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleCapture} style={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid white', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'white' }} />
        </button>
        <div style={{ width: 60 }} />
      </div>
    </div>
  );
};
