# Dockerfile para Backend (FastAPI)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Expose port
EXPOSE 8001

# Command to run the application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]