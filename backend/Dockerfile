FROM python:3.10-slim

# Install LibreOffice & tool pendukung konversi
RUN apt update && apt install -y \
    libreoffice \
    libmagic1 \
    && apt clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy library yang dibutuhkan
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy semua kode backend
COPY . .

# Port default Render
EXPOSE 10000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]