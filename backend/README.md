# 🌾 Smart Crop Advisory System — Backend

A production-like Django REST API backend that provides AI-powered crop recommendation and plant disease detection for farmers and agronomists.

---

## 📁 Project Structure

```
smart_crop_advisory/
│
├── smart_crop_advisory/        ← Django project package
│   ├── settings.py             ← All configuration (DB, JWT, CORS, ML paths)
│   ├── urls.py                 ← Root URL dispatcher
│   └── wsgi.py
│
├── users/                      ← Authentication app
│   ├── models.py               ← CustomUser (email-based login)
│   ├── serializers.py          ← Registration & profile serializers
│   ├── views.py                ← Register, Login, Profile endpoints
│   ├── urls.py                 ← /api/auth/* routes
│   └── admin.py
│
├── crop/                       ← Crop recommendation app
│   ├── models.py               ← CropRecommendation (DB log)
│   ├── serializers.py          ← Input validation serializer
│   ├── views.py                ← /api/predict-crop/ endpoint
│   ├── urls.py
│   ├── ml_loader.py            ← Loads pickle model once at startup
│   └── weather_advisory.py    ← Rule-based advisory logic (bi-lingual)
│
├── disease/                    ← Disease detection app
│   ├── models.py               ← DiseaseDetection (DB log)
│   ├── serializers.py          ← Image upload serializer
│   ├── views.py                ← /api/detect-disease/ endpoint
│   ├── urls.py
│   └── disease_predictor.py   ← CNN wrapper (real model or mock)
│
├── ml_models/                  ← ML artefacts + training scripts
│   ├── train_crop_model.py     ← Train Random Forest → crop_model.pkl
│   ├── train_disease_model.py  ← Fine-tune ResNet-18 → disease_model.pth
│   ├── crop_model.pkl          ← (generated — not in git)
│   ├── label_encoder.pkl       ← (generated — not in git)
│   └── disease_model.pth       ← (generated — not in git)
│
├── media/                      ← Uploaded images (runtime)
├── requirements.txt
├── manage.py
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone & create virtual environment

```bash
git clone <repo-url>
cd smart_crop_advisory

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Apply database migrations

```bash
python manage.py makemigrations users crop disease
python manage.py migrate
```

### 4. Create a superuser (for Django Admin)

```bash
python manage.py createsuperuser
```

### 5. Train the crop ML model

```bash
# Option A — Use the real Kaggle dataset (recommended for production)
# Download from: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
# Place Crop_recommendation.csv inside ml_models/
python ml_models/train_crop_model.py --data ml_models/Crop_recommendation.csv

# Option B — Use synthetic demo data (no dataset needed)
python ml_models/train_crop_model.py
```

### 6. (Optional) Train the disease CNN model

```bash
# Download PlantVillage dataset from Kaggle and unzip to ml_models/PlantVillage/
# https://www.kaggle.com/datasets/emmarex/plantdisease
python ml_models/train_disease_model.py --data ml_models/PlantVillage --epochs 10

# Without the dataset, the backend uses a realistic mock predictor automatically.
```

### 7. Run the development server

```bash
python manage.py runserver
```

Server runs at: **http://127.0.0.1:8000/**

Django Admin: **http://127.0.0.1:8000/admin/**

---

## 🔐 Authentication

All endpoints except **Register** and **Login** require a JWT access token.

Include it in every request header:
```
Authorization: Bearer <access_token>
```

---

## 📡 API Documentation

### Base URL
```
http://127.0.0.1:8000/api/
```

---

### 1. Register

**POST** `/api/auth/register/`

Creates a new user account and returns JWT tokens immediately.

**Request Body**
```json
{
  "username":         "rahul_farmer",
  "email":            "rahul@example.com",
  "password":         "SecurePass@123",
  "confirm_password": "SecurePass@123",
  "phone":            "9876543210",
  "location":         "Meerut, UP",
  "preferred_language": "hi"
}
```

**Response 201**
```json
{
  "message": "Registration successful.",
  "user": {
    "id": 1,
    "username": "rahul_farmer",
    "email": "rahul@example.com",
    "phone": "9876543210",
    "location": "Meerut, UP",
    "preferred_language": "hi",
    "created_at": "2024-12-01T10:00:00Z"
  },
  "tokens": {
    "access":  "<jwt_access_token>",
    "refresh": "<jwt_refresh_token>"
  }
}
```

---

### 2. Login

**POST** `/api/auth/login/`

**Request Body**
```json
{
  "email":    "rahul@example.com",
  "password": "SecurePass@123"
}
```

**Response 200**
```json
{
  "message": "Login successful.",
  "user": { "..." },
  "tokens": {
    "access":  "<jwt_access_token>",
    "refresh": "<jwt_refresh_token>"
  }
}
```

**Response 401**
```json
{ "error": "Invalid credentials." }
```

---

### 3. Refresh Access Token

**POST** `/api/auth/refresh/`

```json
{ "refresh": "<jwt_refresh_token>" }
```

**Response 200**
```json
{ "access": "<new_access_token>" }
```

---

### 4. User Profile

**GET** `/api/auth/profile/`
*Requires: Bearer token*

**Response 200**
```json
{
  "id": 1,
  "username": "rahul_farmer",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "location": "Meerut, UP",
  "preferred_language": "hi",
  "created_at": "2024-12-01T10:00:00Z"
}
```

---

### 5. Crop Recommendation ⭐

**POST** `/api/predict-crop/`
*Requires: Bearer token*

**Request Body**
```json
{
  "nitrogen":    90,
  "phosphorus":  42,
  "potassium":   43,
  "temperature": 20.87,
  "humidity":    82.0,
  "rainfall":    202.93,
  "ph":          6.5,
  "language":    "en"
}
```

| Field       | Type  | Range     | Description          |
|-------------|-------|-----------|----------------------|
| nitrogen    | float | 0–200     | kg/ha                |
| phosphorus  | float | 0–200     | kg/ha                |
| potassium   | float | 0–300     | kg/ha                |
| temperature | float | -10–60    | °C                   |
| humidity    | float | 0–100     | %                    |
| rainfall    | float | 0–500     | mm                   |
| ph          | float | 0–14      | Soil pH              |
| language    | str   | en \| hi  | Response language    |

**Response 200**
```json
{
  "message":          "Crop recommendation generated successfully.",
  "recommended_crop": "rice",
  "confidence":       0.9450,
  "weather_advisory": [
    "💧 High humidity (82.0%). Watch for fungal diseases such as blight and mildew. Improve air circulation and apply preventive fungicide if needed.",
    "🌧️ High rainfall recorded (202.9 mm). Ensure proper field drainage to prevent waterlogging and root rot."
  ],
  "record_id": 12
}
```

**Hindi response (language: "hi")**
```json
{
  "message":          "फसल की सिफारिश सफलतापूर्वक तैयार की गई।",
  "recommended_crop": "rice",
  "confidence":       0.9450,
  "weather_advisory": [
    "💧 उच्च आर्द्रता (82.0%)। ब्लाइट और फफूंद जैसी बीमारियों पर नजर रखें।",
    "🌧️ अधिक वर्षा (202.9 मिमी) दर्ज की गई। जलभराव रोकने के लिए जल निकासी सुनिश्चित करें।"
  ],
  "record_id": 12
}
```

**Error 400** (validation failure)
```json
{
  "errors": {
    "ph": ["Ensure this value is less than or equal to 14."]
  }
}
```

**Error 503** (model not trained yet)
```json
{ "error": "ML model is not available. Please contact the administrator." }
```

---

### 6. Recommendation History

**GET** `/api/history/`
*Requires: Bearer token*

Returns last 20 recommendations for the authenticated user.

**Response 200**
```json
[
  {
    "id": 12,
    "recommended_crop": "rice",
    "confidence": 0.945,
    "nitrogen": 90.0,
    "phosphorus": 42.0,
    "potassium": 43.0,
    "temperature": 20.87,
    "humidity": 82.0,
    "rainfall": 202.93,
    "ph": 6.5,
    "weather_advisory": "...",
    "created_at": "2024-12-01T10:00:00Z"
  }
]
```

---

### 7. Disease Detection 📷

**POST** `/api/detect-disease/`
*Requires: Bearer token*
*Content-Type: multipart/form-data*

**Form Fields**

| Field    | Type | Required | Description                      |
|----------|------|----------|----------------------------------|
| image    | file | ✅       | Plant leaf photo (JPG/PNG ≤10MB) |
| language | str  | ❌       | "en" or "hi" (default: "en")     |

**Example using curl**
```bash
curl -X POST http://127.0.0.1:8000/api/detect-disease/ \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/leaf.jpg" \
  -F "language=en"
```

**Response 200**
```json
{
  "message":    "Disease detection completed successfully.",
  "disease":    "Tomato Early Blight",
  "confidence": 0.8923,
  "remedy":     "Apply mancozeb or chlorothalonil fungicide at 7-day intervals. Remove lower infected leaves. Ensure adequate spacing for air circulation.",
  "record_id":  5
}
```

**Hindi Response**
```json
{
  "message":    "रोग पहचान सफलतापूर्वक पूरी हुई।",
  "disease":    "टमाटर अर्ली ब्लाइट",
  "confidence": 0.8923,
  "remedy":     "7 दिन के अंतराल पर मैन्कोज़ेब या क्लोरोथैलोनिल कवकनाशी लगाएं।...",
  "record_id":  5
}
```

---

### 8. Disease History

**GET** `/api/disease-history/`
*Requires: Bearer token*

Returns last 20 disease detections for the authenticated user.

---

## 🌦️ Weather Advisory Logic

The crop recommendation response always includes `weather_advisory` — a list of contextual messages generated from the input values:

| Condition            | Advice given                                  |
|----------------------|-----------------------------------------------|
| Temperature ≥ 35°C   | Irrigation timing advice                      |
| Temperature ≤ 10°C   | Frost protection advice                       |
| Rainfall ≥ 200 mm    | Drainage advice                               |
| Rainfall ≤ 50 mm     | Drip/sprinkler irrigation advice              |
| Humidity ≥ 80%       | Fungal disease watch + fungicide advice       |
| Humidity ≤ 30%       | Increase irrigation frequency                 |
| pH < 5.5             | Apply agricultural lime                       |
| pH > 7.5             | Apply sulfur / organic compost                |
| All within range     | ✅ Conditions look favourable                 |

All messages are available in **English** and **Hindi**.

---

## 🌐 Multi-language Support

Pass `"language": "en"` or `"language": "hi"` in any request body.

- All response `message` strings are translated.
- All `weather_advisory` strings are translated.
- Disease `disease` names and `remedy` text are translated.
- Crop names are returned as-is (botanical/common names are language-neutral).

---

## 🔑 HTTP Status Code Reference

| Code | Meaning                              |
|------|--------------------------------------|
| 200  | Success                              |
| 201  | Resource created (registration)      |
| 400  | Bad request / validation error       |
| 401  | Unauthenticated / wrong credentials  |
| 403  | Forbidden (account disabled)         |
| 500  | Unexpected server error              |
| 503  | ML model not available               |

---

## 🗄️ Database Models

### CustomUser
| Field               | Type        | Notes                    |
|---------------------|-------------|--------------------------|
| id                  | AutoField   | PK                       |
| username            | CharField   | Unique                   |
| email               | EmailField  | Unique, used for login   |
| phone               | CharField   | Optional                 |
| location            | CharField   | Optional                 |
| preferred_language  | CharField   | "en" or "hi"             |

### CropRecommendation
| Field            | Type      | Notes                  |
|------------------|-----------|------------------------|
| user             | FK        | References CustomUser  |
| nitrogen … ph    | FloatField| Input parameters       |
| recommended_crop | CharField | Model output           |
| confidence       | FloatField| 0.0–1.0                |
| weather_advisory | TextField | Generated messages     |
| created_at       | DateTime  | Auto                   |

### DiseaseDetection
| Field      | Type       | Notes                  |
|------------|------------|------------------------|
| user       | FK         | References CustomUser  |
| image      | ImageField | Stored in media/       |
| disease    | CharField  | Predicted disease name |
| confidence | FloatField | 0.0–1.0                |
| remedy     | TextField  | Treatment advice       |
| created_at | DateTime   | Auto                   |

---

## 🚀 Deployment Checklist

- [ ] Set `DEBUG = False` in settings.py
- [ ] Set `SECRET_KEY` from environment variable
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Switch to MySQL (`DATABASES` section in settings.py)
- [ ] Run `python manage.py collectstatic`
- [ ] Use Gunicorn + Nginx in production
- [ ] Store media files on S3 or similar object storage
- [ ] Set `CORS_ALLOW_ALL_ORIGINS = False` and specify allowed origins

---

## 🧪 Quick Test with curl

```bash
# 1. Register
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test@1234","confirm_password":"Test@1234"}'

# 2. Login → copy the access token
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}'

# 3. Predict crop (replace TOKEN)
curl -X POST http://127.0.0.1:8000/api/predict-crop/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nitrogen":90,"phosphorus":42,"potassium":43,"temperature":20.8,"humidity":82,"rainfall":202,"ph":6.5,"language":"en"}'

# 4. Detect disease
curl -X POST http://127.0.0.1:8000/api/detect-disease/ \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@leaf.jpg" \
  -F "language=hi"
```

---

*Built with ❤️ using Django REST Framework + scikit-learn + PyTorch*
