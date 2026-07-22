import { useState, useCallback } from 'react';
import { ExtractedResult } from '../types/cheque';

const API_URL = 'https://cheque-scanner.onrender.com' ;

export interface OCRState {
  isProcessing: boolean;
  progress: number;
  status: string;
  subStatus: string;
  result: ExtractedResult | null;
  error: string | null;
}

export interface BatchProgress {
  current: number;
  total: number;
  completed: ExtractedResult[];
  failed: string[];
}

export function useClaudeOCR() {
  const [state, setState] = useState<OCRState>({
    isProcessing: false,
    progress: 0,
    status: '',
    subStatus: '',
    result: null,
    error: null
  });

  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    current: 0,
    total: 0,
    completed: [],
    failed: []
  });

  const processImage = useCallback(async (imageFile: File): Promise<ExtractedResult | null> => {
    setState({
      isProcessing: true,
      progress: 10,
      status: 'Uploading image...',
      subStatus: 'Sending to AI engine',
      result: null,
      error: null
    });

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      setState(prev => ({ ...prev, progress: 30, status: 'AI analyzing...', subStatus: 'Claude 3.5 Sonnet reading cheque' }));

      const response = await fetch(`${API_URL}/api/extract`, {
        method: 'POST',
        body: formData
      });

      setState(prev => ({ ...prev, progress: 70, status: 'Parsing results...', subStatus: 'Extracting structured data' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const apiResult = await response.json();

      if (!apiResult.success || !apiResult.data) {
        throw new Error(apiResult.error || 'Failed to extract data');
      }

      const result: ExtractedResult = apiResult.data;

      setState({
        isProcessing: false,
        progress: 100,
        status: 'Extraction complete!',
        subStatus: `Processed in ${result.processingTime}ms`,
        result,
        error: null
      });

      return result;

    } catch (err: any) {
      console.error('OCR Error:', err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || 'Failed to process image. Please try again.'
      }));
      return null;
    }
  }, []);

  // Process multiple images in batch
  const processBatch = useCallback(async (files: File[]): Promise<ExtractedResult[]> => {
    setState({
      isProcessing: true,
      progress: 0,
      status: `Starting batch of ${files.length} cheques...`,
      subStatus: 'Preparing upload',
      result: null,
      error: null
    });

    setBatchProgress({ current: 0, total: files.length, completed: [], failed: [] });

    const results: ExtractedResult[] = [];
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBatchProgress({ current: i + 1, total: files.length, completed: results, failed });
      setState(prev => ({
        ...prev,
        progress: Math.round((i / files.length) * 100),
        status: `Processing cheque ${i + 1} of ${files.length}...`,
        subStatus: file.name
      }));

      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_URL}/api/extract`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          failed.push(file.name);
          continue;
        }

        const apiResult = await response.json();
        if (apiResult.success && apiResult.data) {
          results.push(apiResult.data);
        } else {
          failed.push(file.name);
        }
      } catch (err) {
        failed.push(file.name);
      }
    }

    setBatchProgress({ current: files.length, total: files.length, completed: results, failed });
    setState({
      isProcessing: false,
      progress: 100,
      status: `Batch complete! ${results.length} of ${files.length} successful`,
      subStatus: failed.length > 0 ? `${failed.length} failed` : 'All cheques processed',
      result: null,
      error: null
    });

    return results;
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      status: '',
      subStatus: '',
      result: null,
      error: null
    });
    setBatchProgress({ current: 0, total: 0, completed: [], failed: [] });
  }, []);

  return {
    ...state,
    batchProgress,
    processImage,
    processBatch,
    reset
  };
}
