export interface ChequeData {
  date: string;
  ref: string;
  chqNo: string;
  prj: string;
  credit: string;
  debit: string;
  bal: string;
}

export interface ConfidenceScores {
  date: number;
  ref: number;
  chqNo: number;
  prj: number;
  credit: number;
  debit: number;
  bal: number;
}

export interface ExtractedResult extends ChequeData {
  confidence: ConfidenceScores;
  overallConfidence: number;
  amountMatch: boolean;
  rawText: string;
  processingTime: number;
  ocrEngine: string;
}

export interface BatchEntry extends ExtractedResult {
  id: number;
  status: 'Verified' | 'Needs Review';
  scannedAt: string;
  imageSrc: string;
}
