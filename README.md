# Cheque Scanner Backend - Render Deploy

## Step 1: Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up (you get $5 free credit)
3. Go to **API Keys** → **Create Key**
4. Copy your key (starts with `sk-ant-api03-...`)

## Step 2: Push to GitHub

```bash
cd cheque-scanner-backend-render
git init
git add .
git commit -m "Initial commit"
```

Go to [github.com](https://github.com), create a new repo (e.g., `cheque-backend`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/cheque-backend.git
git push -u origin main
```

## Step 3: Deploy on Render (FREE)

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repo
5. Fill in the form:

| Field | Value |
|-------|-------|
| Name | `cheque-scanner-api` |
| Runtime | `Node` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Plan | `Free` |

6. Click **"Advanced"** and add Environment Variable:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-your-key-here` |
| `CORS_ORIGIN` | `https://cheque-scanner-2.vercel.app` |

7. Click **"Create Web Service"**

8. Wait 2-3 minutes for deploy

9. Copy your URL: `https://cheque-scanner-api.onrender.com`

## Step 4: Connect Frontend

In your frontend (`src/hooks/useClaudeOCR.ts`), change:

```typescript
const API_URL = 'https://cheque-scanner-api.onrender.com';
```

Redeploy frontend:
```bash
npm run build
vercel --prod
```

## Done! 🎉

Your app now uses Claude AI for 95%+ accurate cheque extraction.

## API Endpoints

- `GET /health` - Health check
- `POST /api/extract` - Upload single image
- `POST /api/extract-batch` - Upload multiple images

## Pricing

| Usage | Cost |
|-------|------|
| Render hosting | **FREE** |
| Claude API | ~$0.005 per cheque |
| Free Anthropic credit | $5 (≈1000 cheques) |

After free credit: ~$0.50 for 100 cheques
