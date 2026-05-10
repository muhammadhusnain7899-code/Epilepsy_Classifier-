"""
EDF Preprocessing Module - EXACT match to training preprocessing.
DO NOT MODIFY this preprocessing logic.
"""
import mne
import numpy as np


def preprocess_edf(edf_path: str) -> np.ndarray:
    """
    EDF file ko load kar ke model ke qabil (normalized windows) banata hai.
    
    Args:
        edf_path: Path to the EDF file
        
    Returns:
        np.ndarray: Preprocessed tensor of shape (num_windows, 1250, 31) float32
                    Returns empty array on error
    """
    try:
        # 1. Load EDF
        raw = mne.io.read_raw_edf(edf_path, preload=True, verbose=False)
        
        # 2. Filtering (Bandpass 0.5 - 40.0 Hz)
        raw.filter(0.5, 40.0, fir_design='firwin', verbose=False)
        
        # 3. Resampling (Strictly 250 Hz)
        if raw.info['sfreq'] != 250:
            raw.resample(250, verbose=False)
            
        data = raw.get_data()
        
        # 4. Channel Alignment (Extract exactly 31 Channels)
        if data.shape[0] >= 31:
            data = data[:31, :]
        else:
            # Agar 31 se kam channels hon toh zero padding karein
            padding = np.zeros((31 - data.shape[0], data.shape[1]))
            data = np.vstack((data, padding))

        # 5. Windowing & Normalization (5 Seconds = 1250 samples)
        window_size = 1250
        windows = []
        
        for i in range(0, data.shape[1] - window_size + 1, window_size):
            win = data[:, i:i+window_size].T  # Shape: (1250, 31)
            # Z-Score Normalization
            win = (win - np.mean(win)) / (np.std(win) + 1e-7)
            windows.append(win)
            
        return np.array(windows, dtype=np.float32)
        
    except Exception as e:
        print(f"Preprocessing Error: {str(e)}")
        return np.array([])


def validate_edf(edf_path: str) -> tuple[bool, str]:
    """
    Validate EDF file before preprocessing.
    
    Returns:
        tuple: (is_valid, error_message)
    """
    try:
        raw = mne.io.read_raw_edf(edf_path, preload=False, verbose=False)
        
        n_channels = len(raw.ch_names)
        duration = raw.times[-1]
        sfreq = raw.info['sfreq']
        
        if duration < 5.0:
            return False, f"EDF file too short: {duration:.1f}s (minimum 5s required)"
        
        if n_channels < 1:
            return False, "EDF file has no channels"
            
        return True, f"Valid EDF: {n_channels} channels, {duration:.1f}s, {sfreq}Hz"
        
    except Exception as e:
        return False, f"Invalid EDF file: {str(e)}"
