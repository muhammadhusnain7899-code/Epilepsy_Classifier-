# Hugging Face Spaces Dockerfile for Epilepsy Classifier Backend
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for MNE, HDF5, and scientific computing
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libhdf5-dev \
    pkg-config \
    libfreetype6-dev \
    libpng-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p storage temp && chmod 777 storage temp

# Set environment variables
ENV KERAS_BACKEND=jax
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/app/.cache

# Create cache directory for Hugging Face
RUN mkdir -p /app/.cache && chmod 777 /app/.cache

# Expose port (Hugging Face Spaces uses 7860)
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
    CMD curl -f http://localhost:7860/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
