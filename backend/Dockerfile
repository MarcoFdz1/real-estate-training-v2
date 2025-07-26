# Dockerfile para Backend (FastAPI) - Versión optimizada
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY backend/requirements.txt .

# Install Python dependencies (sin gcc para evitar problemas)
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Expose port
EXPOSE 8001

# Command to run the application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]