---
title: Epilepsy Classifier API
emoji: 🧠
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Epilepsy Classifier API

A FastAPI backend for epilepsy detection using a CNN+LSTM deep learning model.

## Features

- **EEG Analysis**: Upload EDF files for seizure classification
- **AI Chatbot**: Medical assistant powered by Groq (Llama 3.3)
- **User Authentication**: JWT-based auth system
- **History Tracking**: Store and retrieve analysis history

## API Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /eeg/upload` - Upload EDF file for analysis
- `GET /history` - Get analysis history
- `POST /chat` - Chat with AI assistant

## Seizure Classes

- Background (Normal)
- Atonic Seizure
- Clonic Seizure
- Tonic Seizure
- Tonic-Clonic Seizure
- Absence Seizure

## Model

CNN+LSTM model trained on EEG data with:
- Input shape: (1250, 31) - 5 seconds at 250Hz, 31 channels
- 6 output classes
