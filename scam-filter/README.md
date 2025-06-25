# Scam Filter Project

A machine learning-based system that detects potential scam text messages with a user-friendly dashboard interface.

## Project Overview

Scam Filter is a web application that combines a machine learning model with a modern web interface to help users identify potentially fraudulent or scam messages. The system analyzes text input and classifies it as either legitimate or a potential scam, providing confidence scores and maintaining a history of previous checks.

### Key Features

- Real-time scam detection using machine learning
- Clean, responsive web interface
- Input validation and error handling
- History tracking of previous scans
- API status monitoring
- Integrated backend and frontend served from a single endpoint

## Directory Structure

```
scam-filter/
├── api.py                 # FastAPI application (main entry point)
├── frontend/              # Frontend web interface
│   ├── css/
│   │   └── styles.css     # Application styling
│   ├── js/
│   │   └── main.js        # Frontend logic & API integration
│   └── index.html         # Main dashboard HTML
├── dataset/               # Training data for the model
├── project/               # Python virtual environment
├── scam_detector_model.pkl # Serialized ML model
├── text_processing.py     # Text preprocessing utilities
├── train_model.py         # Model training script
└── requirement.txt        # Python dependencies
```

## Installation

### Prerequisites

- Python 3.11+
- Modern web browser

### Setup Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd scam-filter
   ```

2. Activate the existing virtual environment:
   ```bash
   # For bash/zsh
   source project/bin/activate
   
   # For fish shell
   source project/bin/activate.fish
   ```

3. If you need to install dependencies (already installed in the project environment):
   ```bash
   pip install -r requirement.txt
   ```

## Usage Guide

### Starting the Application

The application serves both the frontend and API from a single endpoint:

```bash
# Activate the virtual environment
source project/bin/activate.fish

# Start the integrated service
uvicorn api:app --host 0.0.0.0 --port 8000
```

### Accessing the Application

- **Dashboard**: Open your browser and navigate to `http://localhost:8000`
- **API Documentation**: Available at `http://localhost:8000/api/docs`

### Using the Dashboard

1. The dashboard displays an API status indicator at the top
2. Enter or paste text into the input area
3. Click "Check Text" to analyze
4. View results showing whether the text is classified as legitimate or a scam
5. Review your history of past checks at the bottom of the page

## API Documentation

The API provides endpoints for scam detection and health checking.

### Base URL

When running locally: `http://localhost:8000/api`

### Endpoints

#### `GET /api/health`

Check if the API is running properly.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

#### `POST /api/predict`

Analyze text for potential scams.

**Request Body:**
```json
{
  "text": "Your message to analyze"
}
```

**Response:**
```json
{
  "prediction": true,
  "confidence": 0.98
}
```

Where:
- `prediction`: Boolean indicating if the message is likely a scam (true) or legitimate (false)
- `confidence`: Number between 0-1 indicating the model's confidence in the prediction

### Error Codes

- `400`: Bad request (invalid input)
- `500`: Server error
- `503`: Service unavailable (model loading issue)

## Frontend Documentation

The frontend is built with vanilla HTML, CSS, and JavaScript for simplicity and performance.

### Components

- **Status Indicator**: Shows API connection status in real-time
- **Input Section**: Textarea for entering text to analyze
- **Results Section**: Displays analysis results with visual cues
- **History Section**: Shows previous checks with timestamp and results

### JavaScript Modules

- **API Communication**: Handles all requests to the backend
- **UI Management**: Updates the interface based on application state
- **History Management**: Stores and retrieves history from localStorage
- **Error Handling**: Provides user-friendly error messages

## Development Guidelines

### Adding Features

1. **Backend Changes**:
   - Add new endpoints to the `api_router` in `api.py`
   - Ensure proper validation, error handling and documentation
   - Update the model in `train_model.py` if needed

2. **Frontend Changes**:
   - Follow existing style patterns in CSS
   - Update API endpoints in `main.js` if necessary
   - Ensure responsive design for all viewport sizes

### Code Style

- Use consistent indentation (4 spaces)
- Add appropriate comments for non-trivial code
- Follow PEP 8 guidelines for Python code
- Use clear, descriptive variable and function names

### Testing

Before submitting changes:
1. Ensure the API works with valid and invalid inputs
2. Test the frontend on different browsers and screen sizes
3. Verify error handling works appropriately
4. Check that history management works as expected

## License

Copyright © 2025 Iris Scam-filter Project

