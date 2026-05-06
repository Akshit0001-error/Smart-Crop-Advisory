# 🌾 Smart Crop Advisory System — Full Stack Guide

A full-stack AI-powered crop advisory and plant disease detection app built with **Django REST Framework** (backend) and **React + Vite** (frontend).

---

## Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Running the Backend](#2-running-the-backend)
3. [Running the Frontend](#3-running-the-frontend)
4. [Connecting Frontend to Backend](#4-connecting-frontend-to-backend)
5. [Full Project Deployment (VPS / Ubuntu)](#5-full-project-deployment-vps--ubuntu)
6. [Deploy to Render.com (Free Tier)](#6-deploy-to-rendercom-free-tier)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [API Reference](#8-api-reference)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Project Architecture

```
smart_crop_advisory/          ← Django backend
├── smart_crop_advisory/      ← Django project settings, root URLs
│   ├── settings.py
│   └── urls.py
├── users/                    ← Authentication (JWT), custom user model
├── crop/                     ← Crop recommendation (Random Forest ML model)
├── disease/                  ← Plant disease detection (CNN model)
├── ml_models/                ← Pre-trained .pkl model files
├── media/                    ← Uploaded images (auto-created)
├── manage.py
└── requirements.txt

frontend/                     ← React + Vite frontend
├── src/
│   ├── api/client.js         ← Axios API client with JWT auto-refresh
│   ├── contexts/AuthContext  ← React auth state management
│   ├── components/           ← Layout, ProtectedRoute
│   ├── pages/                ← Dashboard, CropAdvisory, DiseaseDetection, History
│   ├── App.jsx               ← Router setup
│   ├── main.jsx
│   └── index.css             ← Design tokens & global styles
├── index.html
├── vite.config.js
└── package.json
```

**Authentication flow:** Users register/login → receive JWT access + refresh tokens → frontend stores them in `localStorage` → all API calls send `Authorization: Bearer <token>` → auto-refresh on expiry.

---

## 2. Running the Backend

### Prerequisites
- Python 3.9+ (3.11 recommended)
- pip

### Step-by-step

```bash
# 1. Go into the backend folder
cd smart_crop_advisory

# 2. Create and activate a virtual environment
python -m venv venv

# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Apply database migrations
python manage.py migrate

# 5. (Optional) Create a superuser for the Django admin panel
python manage.py createsuperuser

# 6. Start the development server
python manage.py runserver
```

The backend will now be running at **http://localhost:8000**

- Django Admin: http://localhost:8000/admin/
- API root: http://localhost:8000/api/

### Verify it's working

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test@1234","confirm_password":"Test@1234"}'
```

You should get back a `201` response with user data and JWT tokens.

### ML Models

The `ml_models/` directory contains pre-trained `.pkl` files. They are loaded lazily — if a model file is missing, the API returns a `503` with a clear error message. To retrain models, use:

```bash
python ml_models/train_crop_model.py
python ml_models/train_disease_model.py
```

---

## 3. Running the Frontend

### Prerequisites
- Node.js 18+ (download from https://nodejs.org)
- npm (comes with Node.js)

### Step-by-step

```bash
# 1. Go into the frontend folder
cd frontend

# 2. Create your environment file
cp .env.example .env
# Edit .env if your backend runs on a different port/host

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

The frontend will be running at **http://localhost:3000**

Open it in your browser and you should see the login page.

### Build for production

```bash
npm run build
# Output goes to frontend/dist/
```

---

## 4. Connecting Frontend to Backend

### During Development (Default Setup)

The frontend uses a **Vite dev proxy** (`vite.config.js`) that automatically forwards all `/api/` and `/media/` requests from `localhost:3000` → `localhost:8000`.

**This means you just need:**
1. Backend running on port 8000
2. Frontend running on port 3000
3. They connect automatically — no CORS issues

```js
// vite.config.js (already configured)
proxy: {
  '/api':    { target: 'http://localhost:8000', changeOrigin: true },
  '/media':  { target: 'http://localhost:8000', changeOrigin: true },
}
```

### Using a Different Backend URL

If your backend is on a different host or port, edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://192.168.1.100:8000
```

Then restart the frontend dev server.

### Backend CORS Configuration

The backend already has `django-cors-headers` installed and configured:

```python
# settings.py — already set for development
CORS_ALLOW_ALL_ORIGINS = True
```

For **production**, change this to your exact frontend domain:

```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
]
```

---

## 5. Full Project Deployment (VPS / Ubuntu)

This covers deploying both backend and frontend on a single Ubuntu VPS (DigitalOcean, Linode, AWS EC2, etc.)

### 5.1 Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-pip python3-venv nginx git nodejs npm certbot python3-certbot-nginx
```

### 5.2 Deploy the Backend

```bash
# Clone or upload your project
git clone <your-repo-url> /var/www/smart_crop_advisory
cd /var/www/smart_crop_advisory/smart_crop_advisory

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies + gunicorn
pip install -r requirements.txt
pip install gunicorn

# Edit production settings
nano smart_crop_advisory/settings.py
```

**Critical production settings to change:**

```python
SECRET_KEY = 'your-very-long-random-secret-key-here'   # Use os.environ.get
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com', 'your-server-ip']
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = ['https://your-domain.com']
```

```bash
# Collect static files
python manage.py collectstatic --no-input

# Apply migrations
python manage.py migrate

# Test gunicorn runs
gunicorn smart_crop_advisory.wsgi:application --bind 0.0.0.0:8000
# Press Ctrl+C to stop
```

**Create a systemd service** to keep gunicorn running:

```bash
sudo nano /etc/systemd/system/smart_crop.service
```

```ini
[Unit]
Description=Smart Crop Advisory Django App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/smart_crop_advisory/smart_crop_advisory
ExecStart=/var/www/smart_crop_advisory/smart_crop_advisory/venv/bin/gunicorn \
    smart_crop_advisory.wsgi:application \
    --workers 3 \
    --bind unix:/run/smart_crop.sock
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable smart_crop
sudo systemctl start smart_crop
sudo systemctl status smart_crop   # should show "active (running)"
```

### 5.3 Build the Frontend

```bash
cd /var/www/smart_crop_advisory/frontend

# Set backend URL for production build
echo "VITE_API_BASE_URL=" > .env   # Empty = same-origin (recommended when served by same nginx)

npm install
npm run build
# Static files are now in: /var/www/smart_crop_advisory/frontend/dist/
```

### 5.4 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/smart_crop
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Serve React frontend (static files)
    root /var/www/smart_crop_advisory/frontend/dist;
    index index.html;

    # Handle React Router (client-side routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Django/Gunicorn
    location /api/ {
        proxy_pass http://unix:/run/smart_crop.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy Django admin
    location /admin/ {
        proxy_pass http://unix:/run/smart_crop.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Serve Django static files
    location /static/ {
        alias /var/www/smart_crop_advisory/smart_crop_advisory/staticfiles/;
    }

    # Serve uploaded media files
    location /media/ {
        alias /var/www/smart_crop_advisory/smart_crop_advisory/media/;
    }

    # Upload size limit (for leaf images)
    client_max_body_size 15M;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/smart_crop /etc/nginx/sites-enabled/
sudo nginx -t         # Test config (should say "ok")
sudo systemctl reload nginx

# Set up HTTPS with Let's Encrypt (requires a real domain pointed to your server)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Your app is now live at `https://your-domain.com` 🎉

---

## 6. Deploy to Render.com (Free Tier)

Render offers free hosting for both backend (web service) and frontend (static site).

### 6.1 Deploy the Backend on Render

1. Push your code to GitHub
2. Go to https://render.com → New → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory:** `smart_crop_advisory`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --no-input`
   - **Start Command:** `gunicorn smart_crop_advisory.wsgi:application`
5. Add **Environment Variables**:
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=your-backend-app.onrender.com
   ```
6. Click **Create Web Service**

Note the deployed URL (e.g. `https://smart-crop-api.onrender.com`)

### 6.2 Deploy the Frontend on Render

1. Go to Render → New → **Static Site**
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add **Environment Variable**:
   ```
   VITE_API_BASE_URL=https://smart-crop-api.onrender.com
   ```
5. Add a **Rewrite Rule** (for React Router):
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite
6. Click **Create Static Site**

### 6.3 Update Backend CORS

After deploying the frontend, update `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend.onrender.com",
]
```

---

## 7. Environment Variables Reference

### Backend (`smart_crop_advisory/settings.py`)

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | Django secret key (must be random & secret in production) | hardcoded dev key |
| `DEBUG` | Enable debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed host headers | `['*']` |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs allowed to make API requests | All (dev only) |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the Django backend (no trailing slash) | `""` (empty = same origin) |

---

## 8. API Reference

All API endpoints are prefixed with `/api/`.
Protected routes require: `Authorization: Bearer <access_token>`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | ❌ | Register new user |
| POST | `/api/auth/login/` | ❌ | Login, get JWT tokens |
| POST | `/api/auth/refresh/` | ❌ | Refresh access token |
| GET  | `/api/auth/profile/` | ✅ | Get current user profile |

**Register request body:**
```json
{
  "username": "ramesh",
  "email": "ramesh@farm.com",
  "password": "StrongPass@123",
  "confirm_password": "StrongPass@123",
  "phone": "+91 9876543210",
  "location": "Varanasi, UP",
  "preferred_language": "hi"
}
```

**Login request body:**
```json
{ "email": "ramesh@farm.com", "password": "StrongPass@123" }
```

### Crop Recommendation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/predict-crop/` | ✅ | Get crop recommendation |
| GET  | `/api/history/` | ✅ | Last 20 recommendations |

**Predict-crop request body:**
```json
{
  "nitrogen": 90,
  "phosphorus": 42,
  "potassium": 43,
  "temperature": 25.5,
  "humidity": 82,
  "rainfall": 202.9,
  "ph": 6.5,
  "language": "en"
}
```

**Response:**
```json
{
  "message": "Crop recommendation generated successfully.",
  "recommended_crop": "rice",
  "confidence": 0.9231,
  "weather_advisory": ["High humidity detected. Ensure good drainage...", "..."],
  "record_id": 42
}
```

### Disease Detection

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/detect-disease/` | ✅ | Detect plant disease from image |
| GET  | `/api/disease-history/` | ✅ | Last 20 detections |

**Detect-disease request** (multipart/form-data):
```
image: <file>      (JPEG/PNG, max 10 MB)
language: "en"     (or "hi")
```

**Response:**
```json
{
  "message": "Disease detection completed successfully.",
  "disease": "Tomato Late Blight",
  "confidence": 0.8743,
  "remedy": "Apply copper-based fungicide...",
  "record_id": 7
}
```

---

## 9. Troubleshooting

### Backend won't start

```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill existing process
kill -9 <PID>
```

### "ML model not available" error

The `.pkl` model files must exist in `smart_crop_advisory/ml_models/`.

```bash
ls ml_models/
# Should show: crop_model.pkl  label_encoder.pkl
```

If missing, retrain:
```bash
python ml_models/train_crop_model.py
```

### CORS errors in browser

Make sure `corsheaders` is first in `MIDDLEWARE` in `settings.py`, and your frontend origin is in `CORS_ALLOWED_ORIGINS`.

### Frontend shows "Network Error"

1. Check the backend is running: `curl http://localhost:8000/api/auth/login/`
2. Check `frontend/.env` has the correct `VITE_API_BASE_URL`
3. Restart the Vite dev server after changing `.env`

### JWT token expired / logged out unexpectedly

The access token expires in 1 hour (configurable in `settings.py`). The frontend auto-refreshes it using the 7-day refresh token. If you see this in production, check your server clock is accurate:

```bash
sudo timedatectl set-ntp true
```

### Image upload fails

- Max size is 10 MB (enforced by both Django and Nginx)
- Accepted formats: JPEG, PNG
- The `media/` directory must be writable by the server process

```bash
sudo chown -R www-data:www-data /var/www/smart_crop_advisory/smart_crop_advisory/media/
```

### Django migrations issues

```bash
python manage.py showmigrations     # Check status
python manage.py migrate --run-syncdb
```

---

## Quick Start Cheatsheet

```bash
# Terminal 1 — Backend
cd smart_crop_advisory
source venv/bin/activate
python manage.py runserver

# Terminal 2 — Frontend
cd frontend
npm run dev

# Visit: http://localhost:3000
```
