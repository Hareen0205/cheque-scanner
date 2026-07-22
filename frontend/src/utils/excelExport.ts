import * as XLSX from 'xlsx';
import { BatchEntry } from '../types/cheque';
import { parseAmount } from './validators';

export function exportToExcel(batchData: BatchEntry[], filename?: string): void {
  if (batchData.length === 0) {
    alert('No data to export!');
    return;
  }

  const dataRows = batchData.map((row, idx) => ({
    'S.No': idx + 1,
    'Date': row.date || '',
    'Ref': row.ref || '',
    'Chq No': row.chqNo || '',
    'Prj': row.prj || '',
    'Credit': row.credit || '',
    'Debit': row.debit || '',
    'Bal': row.bal || '',
    'Confidence Score': `${row.overallConfidence}%`,
    'Row Consistent': row.amountMatch ? 'Yes' : 'No',
    'Status': row.status,
    'OCR Engine': row.ocrEngine,
    'Scanned At': row.scannedAt
  }));

  const wsData = XLSX.utils.json_to_sheet(dataRows);

  const totalCredit = batchData.reduce((sum, r) => sum + parseAmount(r.credit), 0);
  const totalDebit = batchData.reduce((sum, r) => sum + parseAmount(r.debit), 0);
  const avgConfidence = Math.round(
    batchData.reduce((s, r) => s + r.overallConfidence, 0) / batchData.length
  );

  const summaryRows = [
    { 'Metric': 'Total Entries', 'Value': batchData.length },
    { 'Metric': 'Total Credit', 'Value': totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { 'Metric': 'Total Debit', 'Value': totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { 'Metric': 'Verified', 'Value': batchData.filter(r => r.status === 'Verified').length },
    { 'Metric': 'Needs Review', 'Value': batchData.filter(r => r.status === 'Needs Review').length },
    { 'Metric': 'Average Confidence', 'Value': `${avgConfidence}%` },
    { 'Metric': 'Consistent Rows', 'Value': batchData.filter(r => r.amountMatch).length },
    { 'Metric': 'Rows Needing Check', 'Value': batchData.filter(r => !r.amountMatch).length },
    { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

  wsData['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 32 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 20 }
  ];

  wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsData, 'Cheque Data');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const defaultName = `cheque_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename || defaultName);
}
