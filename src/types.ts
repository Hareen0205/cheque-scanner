export interface ChequeData {
  date: string;
  payee: string;
  amountNum: string;
  amountWords: string;
  chequeNo: string;
  bank: string;
  account: string;
  micr: string;
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
