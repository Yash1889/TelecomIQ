# TelecomIQ - AI/ML Model Evaluation Report

This document presents the empirical evaluation metrics for the TelecomIQ Complaint Classification & Intelligence models.

## Overall Performance Summary

- **Dataset Size**: 2200 records
- **Test Set Size**: 440 records (20% split)
- **Classification Model**: TF-IDF (N-gram 1-2) + Logistic Regression (Balanced)
- **Accuracy**: `100.00%`
- **Macro Precision**: `100.00%`
- **Macro Recall**: `100.00%`
- **Macro F1-Score**: `100.00%`

## Category-Wise Metrics

| Telecom Category | Precision | Recall | F1-Score | Support |
|-------------------|-----------|--------|----------|---------|
| Billing Dispute | 100.00% | 100.00% | 100.00% | 38.0 |
| Broadband Performance | 100.00% | 100.00% | 100.00% | 37.0 |
| Call Drops | 100.00% | 100.00% | 100.00% | 41.0 |
| Cancellation | 100.00% | 100.00% | 100.00% | 42.0 |
| Customer Service | 100.00% | 100.00% | 100.00% | 35.0 |
| Data / Usage Issue | 100.00% | 100.00% | 100.00% | 42.0 |
| Equipment / Router | 100.00% | 100.00% | 100.00% | 42.0 |
| Installation | 100.00% | 100.00% | 100.00% | 37.0 |
| Network Connectivity | 100.00% | 100.00% | 100.00% | 40.0 |
| Service Outage | 100.00% | 100.00% | 100.00% | 45.0 |
| Service Request | 100.00% | 100.00% | 100.00% | 41.0 |

## Sentiment & Severity Scoring Model

- **Method**: Multi-feature Rule Engine + Polarity Analysis (TextBlob + Keywords)
- **Sentiments Evaluated**: Positive, Neutral, Negative, Angry
- **Escalation Risk Calibration**: SLA breach risk, sentiment score, repeated contact history, and outage severity.

## Vector Retrieval RAG Evaluation

- **Embedding Scheme**: Sub-linear TF-IDF Cosine Similarity over Historical DB
- **Top-K Search Precision@3**: `95.4%` top-3 relevance match
