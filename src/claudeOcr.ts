import Anthropic from '@anthropic-ai/sdk';
import { ExtractedResult, ChequeData } from './types.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export async function extractWithClaude(imageBuffer: Buffer): Promise<ExtractedResult> {
  const startTime = Date.now();

  const base64Image = imageBuffer.toString('base64');

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          type: 'text',
          text: `Extract this cheque/ledger entry's row from the image. Return ONLY a JSON object with this exact structure:

{
  "date": "date as shown (e.g. DD.MM.YY)",
  "ref": "reference / description text (e.g. payee, purpose, or narration column)",
  "chqNo": "cheque number",
  "prj": "project / cost-centre code column",
  "credit": "credit amount as shown, with thousands separators (e.g. 1,005.25). Empty string if blank or '-'",
  "debit": "debit amount as shown, with thousands separators (e.g. 20,301.22). Empty string if blank or '-'",
  "bal": "running balance amount as shown, with thousands separators. Empty string if not visible",
  "rawText": "all text you can read from the row/cheque"
}

Rules:
- If a field is not visible, blank, "-", or cannot be read, use empty string ""
- Do not include currency symbols, only the numeric amount with commas and decimals
- Be precise - do not guess. If unsure, leave empty.`
        }
      ]
    }]
  });

  const responseText = message.content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map(block => block.text)
    .join('');

  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    const rawJsonMatch = responseText.match(/({[\s\S]*})/);
    if (rawJsonMatch) {
      jsonStr = rawJsonMatch[1];
    }
  }

  const parsed = JSON.parse(jsonStr);

  const data: ChequeData = {
    date: parsed.date || '',
    ref: parsed.ref || '',
    chqNo: parsed.chqNo || '',
    prj: parsed.prj || '',
    credit: parsed.credit || '',
    debit: parsed.debit || '',
    bal: parsed.bal || ''
  };

  const fieldScores = calculateConfidence(data);
  const overallConfidence = Math.round(
    Object.values(fieldScores).reduce((a, b) => a + b, 0) / Object.keys(fieldScores).length
  );

  return {
    ...data,
    confidence: fieldScores,
    overallConfidence,
    amountMatch: checkAmountMatch(data.credit, data.debit),
    rawText: parsed.rawText || responseText.slice(0, 2000),
    processingTime: Date.now() - startTime,
    ocrEngine: 'claude-sonnet-5'
  };
}

function calculateConfidence(data: ChequeData): Record<string, number> {
  const scores: Record<string, number> = {};
  // date, ref, and prj can legitimately be blank on continuation rows (e.g. "bal b/f"),
  // so a blank value there isn't necessarily an extraction failure.
  const optionalWhenBlank = new Set(['date', 'prj', 'credit', 'debit']);

  for (const [field, value] of Object.entries(data)) {
    if (!value || value.trim() === '') {
      scores[field] = optionalWhenBlank.has(field) ? 70 : 0;
    } else if ((field === 'credit' || field === 'debit' || field === 'bal') && value.match(/^[\d,]+\.\d{2}$/)) {
      scores[field] = 98;
    } else if (field === 'date' && value.match(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/)) {
      scores[field] = 95;
    } else if (field === 'chqNo' && value.match(/^\d{4,10}$/)) {
      scores[field] = 95;
    } else if (value.length > 3) {
      scores[field] = 90;
    } else {
      scores[field] = 60;
    }
  }

  return scores;
}

// A cheque/ledger row should post to either the credit or the debit column, not both.
function checkAmountMatch(creditStr: string, debitStr: string): boolean {
  const hasCredit = !!creditStr && creditStr.trim() !== '';
  const hasDebit = !!debitStr && debitStr.trim() !== '';
  return hasCredit !== hasDebit; // exactly one filled in = consistent
}
