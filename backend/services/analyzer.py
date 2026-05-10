"""
EEG Analysis Service - Orchestrates preprocessing, inference, and majority voting.
"""
import os
from collections import Counter
from typing import Optional
import numpy as np

from ml.preprocessing import preprocess_edf, validate_edf
from ml.inference import predict
from ml.labels import LABEL_MAP


def analyze_eeg_predictions(predictions: np.ndarray) -> dict:
    """
    Apply majority voting to window predictions.
    Ignores all background (class 0) predictions.
    
    Args:
        predictions: Array of predicted class indices
        
    Returns:
        dict with 'result' key containing the final diagnosis
    """
    if predictions.size == 0:
        return {"result": "No Seizure Detected", "details": "No valid windows to analyze"}
    
    # Filter out class 0 (Background/Normal)
    seizure_preds = [int(p) for p in predictions if p != 0]
    
    if not seizure_preds:
        return {
            "result": "No Seizure Detected",
            "details": f"Analyzed {len(predictions)} windows, all classified as normal"
        }
    
    # Find most common seizure class
    counter = Counter(seizure_preds)
    most_common_class, count = counter.most_common(1)[0]
    
    result = LABEL_MAP.get(most_common_class, "Unknown")
    
    return {
        "result": result,
        "details": f"Detected in {count}/{len(predictions)} windows",
        "seizure_windows": len(seizure_preds),
        "total_windows": len(predictions)
    }


def analyze_edf_file(edf_path: str) -> dict:
    """
    Full pipeline: validate -> preprocess -> inference -> majority voting.
    
    Args:
        edf_path: Path to the EDF file
        
    Returns:
        dict with analysis results
    """
    # Step 1: Validate EDF
    is_valid, message = validate_edf(edf_path)
    if not is_valid:
        return {
            "success": False,
            "error": message,
            "result": None
        }
    
    # Step 2: Preprocess
    windows = preprocess_edf(edf_path)
    
    if windows.size == 0:
        return {
            "success": False,
            "error": "Preprocessing failed - no valid windows extracted",
            "result": None
        }
    
    # Step 3: Run inference
    try:
        predicted_classes, probabilities = predict(windows)
    except Exception as e:
        return {
            "success": False,
            "error": f"Inference failed: {str(e)}",
            "result": None
        }
    
    # Step 4: Majority voting
    analysis = analyze_eeg_predictions(predicted_classes)
    
    # Calculate confidence from probabilities
    if probabilities.size > 0:
        max_probs = np.max(probabilities, axis=1)
        avg_confidence = float(np.mean(max_probs) * 100)
    else:
        avg_confidence = 0.0
    
    return {
        "success": True,
        "result": analysis["result"],
        "confidence": round(avg_confidence, 1),
        "details": analysis.get("details", ""),
        "windows_analyzed": len(predicted_classes)
    }
