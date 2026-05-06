import os
import pickle
import argparse
import sys

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, ConfusionMatrixDisplay

# ── Paths ───────────────────────────────────────────────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR  = SCRIPT_DIR
DEFAULT_CSV = os.path.join(SCRIPT_DIR, 'Crop_recommendation.csv')

MODEL_PATH   = os.path.join(OUTPUT_DIR, 'crop_model.pkl')
ENCODER_PATH = os.path.join(OUTPUT_DIR, 'label_encoder.pkl')

# ── Columns ─────────────────────────────────────────────────────────
FEATURE_COLS = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
TARGET_COL   = 'label'


def generate_synthetic_dataset():
    print("[INFO] Generating synthetic dataset...")
    rng = np.random.default_rng(42)

    data = pd.DataFrame({
        'N': rng.integers(0, 140, 2000),
        'P': rng.integers(5, 145, 2000),
        'K': rng.integers(5, 205, 2000),
        'temperature': rng.uniform(20, 40, 2000),
        'humidity': rng.uniform(30, 90, 2000),
        'ph': rng.uniform(5.0, 8.5, 2000),
        'rainfall': rng.uniform(20, 300, 2000),
        'label': rng.choice(['rice','maize','chickpea','kidneybeans','pigeonpeas'], 2000)
    })

    return data


def train(csv_path: str):

    # 1. Load dataset
    if os.path.exists(csv_path):
        print(f"[INFO] Loading dataset from {csv_path}")
        df = pd.read_csv(csv_path)
    else:
        df = generate_synthetic_dataset()

    # 2. Prepare data
    X = df[FEATURE_COLS].values
    y_raw = df[TARGET_COL].values

    le = LabelEncoder()
    y = le.fit_transform(y_raw)

    print(f"[INFO] Classes: {list(le.classes_)}")

    # 3. Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 4. Train model
    clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    # 5. Predictions
    y_pred = clf.predict(X_test)

    # 6. Evaluation
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[RESULT] Accuracy: {acc*100:.2f}%\n")

    print("[CLASSIFICATION REPORT]\n")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # 7. 🔥 CONFUSION MATRIX (NEW)
    cm = confusion_matrix(y_test, y_pred)

    print("\n[CONFUSION MATRIX]\n", cm)

    plt.figure(figsize=(10, 8))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=le.classes_)
    disp.plot(cmap='Blues', xticks_rotation=45)

    plt.title("Confusion Matrix - Crop Prediction Model")
    plt.tight_layout()

    # Save image for report
    cm_path = os.path.join(OUTPUT_DIR, "confusion_matrix.png")
    plt.savefig(cm_path)
    print(f"[SAVED] Confusion Matrix Image → {cm_path}")

    plt.show()

    # 8. Cross-validation
    cv_scores = cross_val_score(clf, X, y, cv=5)
    print(f"[RESULT] CV Accuracy: {cv_scores.mean()*100:.2f}%")

    # 9. Save model
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(clf, f)

    with open(ENCODER_PATH, 'wb') as f:
        pickle.dump(le, f)

    print("\n✅ Training Complete!")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', default=DEFAULT_CSV)
    args = parser.parse_args()

    train(args.data)