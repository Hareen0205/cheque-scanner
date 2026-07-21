import Anthropic from '@anthropic-ai/sdk';
import { ExtractedResult, ChequeData } from './types.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export async function extractWithClaude(imageBuffer: Buffer): Promise<ExtractedResult> {
  const startTime = Date.now();

  const base64Image = imageBuffer.toString('base64');

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
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
          text: `Extract all information from this cheque image. Return ONLY a JSON object with this exact structure:

{
  "date": "date on cheque (DD/MM/YYYY or MM/DD/YYYY)",
  "payee": "name of payee (who the cheque is made out to)",
  "amountNum": "amount in numbers with $ symbol (e.g. $1,250.00)",
  "amountWords": "amount written in words (e.g. One Thousand Two Hundred Fifty Dollars)",
  "chequeNo": "cheque number (usually top right, 6-10 digits)",
  "bank": "bank name",
  "account": "account number if visible (mask with asterisks if full number shown)",
  "micr": "MICR code at bottom of cheque (numbers with special symbols)",
  "rawText": "all text you can read from the cheque"
}

Rules:
- If a field is not visible or cannot be read, use empty string ""
- For amountNum, always include the $ symbol
- For amountWords, write out the full amount in words
- For account numbers, show only last 4 digits if full number is visible (e.g. ****1234)
- The MICR line is at the very bottom - read all numbers and symbols you see there
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
    payee: parsed.payee || '',
    amountNum: parsed.amountNum || '',
    amountWords: parsed.amountWords || '',
    chequeNo: parsed.chequeNo || '',
    bank: parsed.bank || '',
    account: parsed.account || '',
    micr: parsed.micr || ''
  };

  const fieldScores = calculateConfidence(data);
  const overallConfidence = Math.round(
    Object.values(fieldScores).reduce((a, b) => a + b, 0) / Object.keys(fieldScores).length
  );

  return {
    ...data,
    confidence: fieldScores,
    overallConfidence,
    amountMatch: checkAmountMatch(data.amountNum, data.amountWords),
    rawText: parsed.rawText || responseText.slice(0, 2000),
    processingTime: Date.now() - startTime,
    ocrEngine: 'claude-3-5-sonnet'
  };
}

function calculateConfidence(data: ChequeData): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const [field, value] of Object.entries(data)) {
    if (!value || value.trim() === '') {
      scores[field] = 0;
    } else if (field === 'amountNum' && value.match(/^\$[\d,]+\.\d{2}$/)) {
      scores[field] = 98;
    } else if (field === 'date' && value.match(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/)) {
      scores[field] = 95;
    } else if (field === 'chequeNo' && value.match(/^\d{6,10}$/)) {
      scores[field] = 95;
    } else if (value.length > 3) {
      scores[field] = 90;
    } else {
      scores[field] = 60;
    }
  }

  return scores;
}

function checkAmountMatch(numStr: string, wordStr: string): boolean {
  if (!numStr || !wordStr) return false;
  const numMatch = numStr.match(/[\d,]+\.\d{2}/);
  if (!numMatch) return false;
  const numValue = parseFloat(numMatch[0].replace(/,/g, ''));
  const hasDollarWords = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million)\b/i.test(wordStr);
  return numValue > 0 && hasDollarWords;
}
