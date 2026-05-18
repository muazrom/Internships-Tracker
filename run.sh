#!/bin/bash
# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the application
echo "Starting the Internship Tracker on http://127.0.0.1:8000"
uvicorn backend.main:app --reload
