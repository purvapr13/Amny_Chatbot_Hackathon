# Use official lightweight Python image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /app

# Copy requirements and install them
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy all other project files
COPY . .

#COPY intent_classifier_model/ /app/intent_classifier_model/

# Expose Flask port
EXPOSE 5000

# Run your app
CMD ["python", "app.py"]
