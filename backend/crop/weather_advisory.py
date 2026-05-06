"""
weather_advisory.py
───────────────────
Pure-logic module: takes the input parameters and returns
human-readable advisory messages in English or Hindi.

No external API is needed — rules are derived from the input values themselves.
"""

# ── Thresholds ──────────────────────────────────────────────────────────────
HIGH_TEMP_THRESHOLD    = 35.0   # °C
LOW_TEMP_THRESHOLD     = 10.0   # °C
HIGH_RAINFALL_MM       = 200.0  # mm
LOW_RAINFALL_MM        = 50.0   # mm
HIGH_HUMIDITY_PCT      = 80.0   # %
LOW_HUMIDITY_PCT       = 30.0   # %
ACIDIC_PH              = 5.5
ALKALINE_PH            = 7.5

# ── Translation map ─────────────────────────────────────────────────────────
MESSAGES = {
    "high_temp": {
        "en": (
            "⚠️ High temperature detected ({temp:.1f}°C). "
            "Ensure adequate irrigation — water your crops early morning or late evening "
            "to reduce evaporation losses."
        ),
        "hi": (
            "⚠️ उच्च तापमान ({temp:.1f}°C) दर्ज किया गया। "
            "फसलों की पर्याप्त सिंचाई सुनिश्चित करें — सुबह जल्दी या शाम को पानी दें "
            "ताकि वाष्पीकरण कम हो।"
        ),
    },
    "low_temp": {
        "en": (
            "🌡️ Low temperature detected ({temp:.1f}°C). "
            "Protect frost-sensitive crops with mulching or row covers. "
            "Avoid irrigation during freezing hours."
        ),
        "hi": (
            "🌡️ कम तापमान ({temp:.1f}°C) दर्ज किया गया। "
            "पाले से संवेदनशील फसलों को मल्चिंग या कवर से बचाएं। "
            "जमाव के समय सिंचाई से बचें।"
        ),
    },
    "high_rainfall": {
        "en": (
            "🌧️ High rainfall recorded ({rain:.1f} mm). "
            "Ensure proper field drainage to prevent waterlogging and root rot. "
            "Avoid heavy fertilizer application during rains."
        ),
        "hi": (
            "🌧️ अधिक वर्षा ({rain:.1f} मिमी) दर्ज की गई। "
            "जलभराव और जड़ सड़न रोकने के लिए खेत में उचित जल निकासी सुनिश्चित करें। "
            "बारिश के दौरान भारी उर्वरक प्रयोग से बचें।"
        ),
    },
    "low_rainfall": {
        "en": (
            "☀️ Low rainfall ({rain:.1f} mm). "
            "Consider drip or sprinkler irrigation. "
            "Mulching can help retain soil moisture."
        ),
        "hi": (
            "☀️ कम वर्षा ({rain:.1f} मिमी)। "
            "ड्रिप या स्प्रिंकलर सिंचाई पर विचार करें। "
            "मल्चिंग से मिट्टी की नमी बनाए रखने में मदद मिल सकती है।"
        ),
    },
    "high_humidity": {
        "en": (
            "💧 High humidity ({hum:.1f}%). "
            "Watch for fungal diseases such as blight and mildew. "
            "Improve air circulation and apply preventive fungicide if needed."
        ),
        "hi": (
            "💧 उच्च आर्द्रता ({hum:.1f}%)। "
            "ब्लाइट और फफूंद जैसी बीमारियों पर नजर रखें। "
            "वायु संचार सुधारें और आवश्यकतानुसार कवकनाशी का उपयोग करें।"
        ),
    },
    "low_humidity": {
        "en": (
            "🏜️ Low humidity ({hum:.1f}%). "
            "Crops may show wilting — increase irrigation frequency. "
            "Evening watering is recommended."
        ),
        "hi": (
            "🏜️ कम आर्द्रता ({hum:.1f}%)। "
            "फसलें मुरझा सकती हैं — सिंचाई की आवृत्ति बढ़ाएं। "
            "शाम को पानी देने की सलाह दी जाती है।"
        ),
    },
    "acidic_soil": {
        "en": (
            "🧪 Soil pH is acidic ({ph:.1f}). "
            "Apply agricultural lime (CaCO₃) to raise pH. "
            "Most crops prefer pH 6.0–7.0."
        ),
        "hi": (
            "🧪 मिट्टी का pH अम्लीय है ({ph:.1f})। "
            "pH बढ़ाने के लिए कृषि चूना (CaCO₃) डालें। "
            "अधिकांश फसलें pH 6.0–7.0 पसंद करती हैं।"
        ),
    },
    "alkaline_soil": {
        "en": (
            "🧪 Soil pH is alkaline ({ph:.1f}). "
            "Apply sulfur or organic compost to lower pH. "
            "Micronutrient deficiency (Fe, Zn) may occur at high pH."
        ),
        "hi": (
            "🧪 मिट्टी का pH क्षारीय है ({ph:.1f})। "
            "pH कम करने के लिए सल्फर या जैव खाद डालें। "
            "अधिक pH पर सूक्ष्म पोषक तत्व (Fe, Zn) की कमी हो सकती है।"
        ),
    },
    "all_good": {
        "en": (
            "✅ Conditions look favourable. "
            "Follow standard agronomic practices for the recommended crop."
        ),
        "hi": (
            "✅ परिस्थितियाँ अनुकूल लग रही हैं। "
            "अनुशंसित फसल के लिए मानक कृषि पद्धतियों का पालन करें।"
        ),
    },
}


def get_weather_advisory(
    temperature: float,
    rainfall: float,
    humidity: float,
    ph: float,
    language: str = "en",
) -> list[str]:
    """
    Evaluate input conditions and return a list of advisory messages.

    Parameters
    ----------
    temperature : float  — °C
    rainfall    : float  — mm
    humidity    : float  — %
    ph          : float  — soil pH
    language    : str    — "en" or "hi"

    Returns
    -------
    list[str]  — one message per triggered condition; at least one entry.
    """
    lang = language if language in ("en", "hi") else "en"
    advisories = []

    # ── Temperature checks ───────────────────────────────────────────
    if temperature >= HIGH_TEMP_THRESHOLD:
        advisories.append(
            MESSAGES["high_temp"][lang].format(temp=temperature)
        )
    elif temperature <= LOW_TEMP_THRESHOLD:
        advisories.append(
            MESSAGES["low_temp"][lang].format(temp=temperature)
        )

    # ── Rainfall checks ──────────────────────────────────────────────
    if rainfall >= HIGH_RAINFALL_MM:
        advisories.append(
            MESSAGES["high_rainfall"][lang].format(rain=rainfall)
        )
    elif rainfall <= LOW_RAINFALL_MM:
        advisories.append(
            MESSAGES["low_rainfall"][lang].format(rain=rainfall)
        )

    # ── Humidity checks ──────────────────────────────────────────────
    if humidity >= HIGH_HUMIDITY_PCT:
        advisories.append(
            MESSAGES["high_humidity"][lang].format(hum=humidity)
        )
    elif humidity <= LOW_HUMIDITY_PCT:
        advisories.append(
            MESSAGES["low_humidity"][lang].format(hum=humidity)
        )

    # ── Soil pH checks ───────────────────────────────────────────────
    if ph < ACIDIC_PH:
        advisories.append(
            MESSAGES["acidic_soil"][lang].format(ph=ph)
        )
    elif ph > ALKALINE_PH:
        advisories.append(
            MESSAGES["alkaline_soil"][lang].format(ph=ph)
        )

    # ── Fallback: everything looks fine ─────────────────────────────
    if not advisories:
        advisories.append(MESSAGES["all_good"][lang])

    return advisories
