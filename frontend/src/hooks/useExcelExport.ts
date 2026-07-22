import { useState, useCallback } from 'react';
import { BatchEntry } from '../types/cheque';
import { exportToExcel } from '../utils/excelExport';

export interface ExportState {
  isExporting: boolean;
  exported: boolean;
  count: number;
  error: string | null;
}

export function useExcelExport() {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    exported: false,
    count: 0,
    error: null
  });

  const exportBatch = useCallback((batchData: BatchEntry[]) => {
    if (batchData.length === 0) {
      setState(prev => ({ ...prev, error: 'No data to export' }));
      return;
    }

    setState({ isExporting: true, exported: false, count: batchData.length, error: null });

    try {
      exportToExcel(batchData);
      setState({ isExporting: false, exported: true, count: batchData.length, error: null });
    } catch (err: any) {
      setState({ isExporting: false, exported: false, count: 0, error: err.message || 'Export failed' });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isExporting: false, exported: false, count: 0, error: null });
  }, []);

  return {
    ...state,
    exportBatch,
    reset
  };
}
