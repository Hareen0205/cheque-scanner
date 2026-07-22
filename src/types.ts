export interface ChequeData {
  date: string;
  ref: string;
  chqNo: string;
  prj: string;
  credit: string;
  debit: string;
  bal: string;
}

export interface ExtractedResult extends ChequeData {
  confidence: Record<string, number>;
  overallConfidence: number;
  amountMatch: boolean;
  rawText: string;
  processingTime: number;
  ocrEngine: string;
}

export interface ApiResponse {
  success: boolean;
  data?: ExtractedResult;
  error?: string;
  processingTime: number;
}
