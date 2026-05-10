"""
Model Inference Module - Loads CNN+LSTM model and runs predictions.
Model is loaded ONCE at module import time.
Uses Keras 3 standalone (compatible with Python 3.14).
"""
import os
import numpy as np
import keras

_model = None


def load_model(model_path: str) -> keras.Model:
    """
    Load the Keras model from disk.
    Called once during server startup.
    """
    global _model
    if _model is None:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        _model = keras.models.load_model(model_path)
        print(f"Model loaded successfully from {model_path}")
        print(f"Model input shape: {_model.input_shape}")
    return _model


def get_model() -> keras.Model:
    """Get the loaded model instance."""
    if _model is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")
    return _model


def predict(windows: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Run inference on preprocessed EEG windows.
    
    Args:
        windows: Preprocessed tensor of shape (num_windows, 1250, 31) float32
        
    Returns:
        tuple: (predicted_classes, prediction_probabilities)
            - predicted_classes: shape (num_windows,) int
            - prediction_probabilities: shape (num_windows, num_classes) float
    """
    model = get_model()
    
    if windows.size == 0:
        return np.array([]), np.array([])
    
    # Ensure correct shape
    if len(windows.shape) != 3:
        raise ValueError(f"Expected 3D tensor, got shape {windows.shape}")
    
    # Run prediction
    probs = model.predict(windows, verbose=0)
    classes = np.argmax(probs, axis=1)
    
    return classes, probs
