# Epilepsy Classifier

A full-stack epilepsy detection system using deep learning (CNN+LSTM) with a React Native mobile app and FastAPI backend.

## Features

- **EEG Analysis**: Upload EDF files for automatic seizure detection
- **AI Chatbot**: Medical assistant powered by Groq AI (free, fast)
- **Cross-Platform**: Works on iOS, Android, and Web
- **Real-time Results**: Get seizure classification with confidence scores

## Tech Stack

### Backend
- FastAPI (Python)
- Keras 3 with JAX backend
- MNE for EEG preprocessing
- Groq AI for chatbot (Llama 3.3)
- SQLite/PostgreSQL

### Frontend
- React Native + Expo
- TypeScript
- Axios for API calls

### ML Model
- CNN+LSTM architecture
- Input: EDF files (EEG data)
- Output: 6 seizure classes
- Preprocessing: Bandpass filter (0.5-40Hz), 250Hz resampling

## Seizure Classes

| Class | Type |
|-------|------|
| 0 | Background (Normal) |
| 1 | Atonic Seizure |
| 2 | Clonic Seizure |
| 3 | Tonic Seizure |
| 4 | Tonic-Clonic Seizure |
| 5 | Absence Seizure |

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
export KERAS_BACKEND=jax
export GROQ_API_KEY=your_key_here
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
npm install
npx expo start
```

## Deployment

- **Backend**: Deployed on Hugging Face Spaces
- **Mobile**: Built with EAS Build (Expo)

## License

MIT License
