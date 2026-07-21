import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { extractWithClaude } from './claudeOcr.js';
import { ApiResponse } from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, TIFF, WEBP) are allowed'));
    }
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/extract', upload.single('image'), async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: 'No image file provided',
        processingTime: Date.now() - startTime
      };
      return res.status(400).json(response);
    }

    console.log(`Processing ${req.file.originalname} (${req.file.size} bytes)`);

    const result = await extractWithClaude(req.file.buffer);

    const response: ApiResponse = {
      success: true,
      data: result,
      processingTime: Date.now() - startTime
    };

    console.log(`Completed in ${response.processingTime}ms`);
    res.json(response);

  } catch (error: any) {
    console.error('Error:', error.message);

    const response: ApiResponse = {
      success: false,
      error: error.message || 'Failed to process image',
      processingTime: Date.now() - startTime
    };

    res.status(500).json(response);
  }
});

app.post('/api/extract-batch', upload.array('images', 10), async (req, res) => {
  const startTime = Date.now();

  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided',
        processingTime: Date.now() - startTime
      });
    }

    console.log(`Processing batch of ${files.length} images`);

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const result = await extractWithClaude(file.buffer);
          return { success: true, data: result, filename: file.originalname };
        } catch (error: any) {
          return { success: false, error: error.message, filename: file.originalname };
        }
      })
    );

    res.json({
      success: true,
      results,
      processingTime: Date.now() - startTime
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    });
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    processingTime: 0
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Cheque Scanner API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 OCR Engine: Claude 3.5 Sonnet`);
});
