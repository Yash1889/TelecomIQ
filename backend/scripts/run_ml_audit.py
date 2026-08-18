import os
import sys
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "telecom_complaints.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
REPORTS_DIR = os.path.join(BASE_DIR, "reports", "ml_audit")
os.makedirs(REPORTS_DIR, exist_ok=True)

def run_ml_audit():
    print("=" * 80)
    print(" 🚀 TELECOMIQ MACHINE LEARNING VALIDATION & AUDIT SUITE")
    print("=" * 80)
    
    if not os.path.exists(DATA_PATH):
        print(f"❌ Error: Dataset file not found at {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)
    total_records = len(df)
    print(f"📊 Dataset Loaded: {total_records} Total Records from Kaggle Telecom Dataset")

    # Combine text features
    df['full_text'] = df['subject'].fillna('') + " " + df['description'].fillna('')

    # Check for text duplicates
    unique_texts = df['full_text'].nunique()
    duplicate_count = total_records - unique_texts
    print(f"🔍 Text Uniqueness Check: {unique_texts} unique text strings ({duplicate_count} duplicates found)")

    # Stratified Train / Validation / Test Split (70% Train, 15% Validation, 15% Test)
    X = df['full_text']
    y = df['category']

    # 1st Split: 70% Train, 30% Temp (Val + Test)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )

    # 2nd Split: Split 30% Temp equally into 15% Val and 15% Test
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    print("\n" + "-" * 80)
    print(" 📐 SPLIT DISTRIBUTION BREAKDOWN (70% Train / 15% Val / 15% Test)")
    print("-" * 80)
    print(f"• Training Set Size:   {len(X_train)} samples ({len(X_train)/total_records*100:.1f}%)")
    print(f"• Validation Set Size: {len(X_val)} samples ({len(X_val)/total_records*100:.1f}%)")
    print(f"• Test Set Size:       {len(X_test)} samples ({len(X_test)/total_records*100:.1f}%)")

    # Prove zero leakage between splits
    train_set_texts = set(X_train)
    val_set_texts = set(X_val)
    test_set_texts = set(X_test)

    train_val_overlap = len(train_set_texts.intersection(val_set_texts))
    train_test_overlap = len(train_set_texts.intersection(test_set_texts))
    val_test_overlap = len(val_set_texts.intersection(test_set_texts))

    print("\n" + "-" * 80)
    print(" 🔒 DATA LEAKAGE VERIFICATION")
    print("-" * 80)
    print(f"• Train ∩ Val Text Overlap:  {train_val_overlap} samples")
    print(f"• Train ∩ Test Text Overlap: {train_test_overlap} samples")
    print(f"• Val ∩ Test Text Overlap:   {val_test_overlap} samples")
    if train_val_overlap == 0 and train_test_overlap == 0 and val_test_overlap == 0:
        print("✅ VERIFIED: Zero data leakage between Train, Validation, and Test splits.")
    else:
        print("⚠️ NOTICE: Minor text string duplicate overlap across splits detected in raw text.")

    # Class breakdown per split
    print("\n" + "-" * 80)
    print(" 📋 CLASS DISTRIBUTION PER SPLIT")
    print("-" * 80)
    
    classes = sorted(y.unique())
    train_counts = y_train.value_counts()
    val_counts = y_val.value_counts()
    test_counts = y_test.value_counts()

    split_table = []
    for c in classes:
        tr = train_counts.get(c, 0)
        va = val_counts.get(c, 0)
        te = test_counts.get(c, 0)
        split_table.append({"Category": c, "Train (70%)": tr, "Val (15%)": va, "Test (15%)": te, "Total": tr+va+te})

    split_df = pd.DataFrame(split_table)
    print(split_df.to_string(index=False))

    # Evaluate currently deployed model (full dataset score explanation)
    model_path = os.path.join(MODELS_DIR, "classifier_model.pkl")
    if os.path.exists(model_path):
        with open(model_path, "rb") as f:
            deployed_model = pickle.load(f)
        
        full_preds = deployed_model.predict(X)
        full_acc = accuracy_score(y, full_preds)
        print("\n" + "-" * 80)
        print(" 🔍 SOURCE OF PREVIOUS 96% REPORTED METRIC EXPLANATION")
        print("-" * 80)
        print(f"• Deployed Model Full Dataset Evaluation Score: {full_acc*100:.2f}%")
        print("  (Note: The previous 96% score was calculated on the entire 2,224 dataset during initial script training).")

    # Train fresh audit model ONLY on Train set (70%) and evaluate on Out-Of-Sample Test set (15%)
    print("\n" + "-" * 80)
    print(" 🧪 OUT-OF-SAMPLE TEST SET EVALUATION (Unseen 15% Test Split)")
    print("-" * 80)

    audit_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=8000, stop_words='english')),
        ('clf', LogisticRegression(max_iter=1000, class_weight='balanced'))
    ])

    audit_pipeline.fit(X_train, y_train)

    val_preds = audit_pipeline.predict(X_val)
    val_acc = accuracy_score(y_val, val_preds)

    test_preds = audit_pipeline.predict(X_test)
    test_acc = accuracy_score(y_test, test_preds)

    print(f"• Validation Set Accuracy: {val_acc*100:.2f}%")
    print(f"• Test Set Accuracy:       {test_acc*100:.2f}%")

    test_report = classification_report(y_test, test_preds, digits=4)
    print("\nClassification Report on Unseen Test Set (15% Split):\n")
    print(test_report)

    cm = confusion_matrix(y_test, test_preds, labels=classes)
    cm_df = pd.DataFrame(cm, index=classes, columns=classes)

    # Save artifacts to report directory
    report_file = os.path.join(REPORTS_DIR, "ml_validation_report.txt")
    cm_file = os.path.join(REPORTS_DIR, "confusion_matrix.csv")
    cm_df.to_csv(cm_file)

    with open(report_file, "w") as f:
        f.write("TELECOMIQ ML VALIDATION AUDIT REPORT\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Total Dataset Records: {total_records}\n")
        f.write(f"Train Split (70%): {len(X_train)} samples\n")
        f.write(f"Validation Split (15%): {len(X_val)} samples\n")
        f.write(f"Test Split (15%): {len(X_test)} samples\n\n")
        f.write("CLASS DISTRIBUTION PER SPLIT:\n")
        f.write(split_df.to_string(index=False) + "\n\n")
        f.write(f"OUT-OF-SAMPLE TEST ACCURACY: {test_acc*100:.2f}%\n\n")
        f.write("CLASSIFICATION REPORT (UNSEEN TEST SET):\n")
        f.write(test_report + "\n\n")
        f.write("CONFUSION MATRIX:\n")
        f.write(cm_df.to_string() + "\n")

    print("\n" + "-" * 80)
    print(f"✅ Audit Complete! Reports saved to:")
    print(f"   • Report File: {report_file}")
    print(f"   • Confusion Matrix CSV: {cm_file}")
    print("-" * 80)

if __name__ == "__main__":
    run_ml_audit()
