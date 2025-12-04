# Deployment ke Google Cloud Run

## Langkah-langkah Deploy

### 1. Build Docker Image
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/viber-api
```

### 2. Deploy ke Cloud Run
```bash
gcloud run deploy viber-api \
  --image gcr.io/YOUR_PROJECT_ID/viber-api \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=your_supabase_url,SUPABASE_KEY=your_supabase_key
```

### 3. Atau gunakan satu perintah (build & deploy)
```bash
gcloud run deploy viber-api \
  --source . \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=your_supabase_url,SUPABASE_KEY=your_supabase_key
```

## Environment Variables
Pastikan set environment variables di Cloud Run:
- `SUPABASE_URL`: URL Supabase project Anda
- `SUPABASE_KEY`: Anon/Public key dari Supabase

## Port
Cloud Run secara otomatis menggunakan PORT=8080
