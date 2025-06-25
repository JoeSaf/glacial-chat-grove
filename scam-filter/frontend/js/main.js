// Constants
const API_BASE_URL = ''; // Empty string for relative paths - API is now served from same origin
const API_PREFIX = '/api'; // New API prefix
const HISTORY_STORAGE_KEY = 'scam_filter_history';
const MAX_HISTORY_ITEMS = 10;
const MAX_TEXT_LENGTH = 5000;
const API_TIMEOUT_MS = 10000; // 10 seconds
const API_RETRY_ATTEMPTS = 3;
const API_RETRY_DELAY_MS = 1000; // 1 second

// DOM Elements
const elements = {
    statusIndicator: document.querySelector('.status-indicator'),
    statusText: document.querySelector('.status-text'),
    messageInput: document.getElementById('messageInput'),
    checkButton: document.getElementById('checkButton'),
    buttonText: document.querySelector('.btn-text'),
    buttonLoading: document.querySelector('.btn-loading'),
    resultsSection: document.getElementById('resultsSection'),
    resultIcon: document.getElementById('resultIcon'),
    resultMessage: document.getElementById('resultMessage'),
    historyList: document.getElementById('historyList')
};

// State
let apiOnline = false;
let isLoading = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    checkApiStatus();
    setupEventListeners();
    loadHistoryFromStorage();
});

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
    elements.checkButton.addEventListener('click', handleSubmit);
}

/**
 * Check if the API is online with retry logic
 */
async function checkApiStatus() {
    updateStatusUI('checking');
    
    let retryCount = 0;
    
    while (retryCount < API_RETRY_ATTEMPTS) {
        try {
            // Use AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
            
            try {
                const response = await fetch(`${API_PREFIX}/health`, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('API Status:', data);
                    apiOnline = true;
                    updateStatusUI('online', 'API is online and healthy');
                    return; // Success, exit the function
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API returned error ${response.status}: ${errorData.detail || response.statusText}`);
                }
            } catch (fetchError) {
                if (fetchError.name === 'AbortError') {
                    throw new Error('API request timed out after ' + (API_TIMEOUT_MS / 1000) + ' seconds');
                }
                throw fetchError;
            }
        } catch (error) {
            console.error(`API Status Error (attempt ${retryCount + 1}/${API_RETRY_ATTEMPTS}):`, error);
            retryCount++;
            
            if (retryCount < API_RETRY_ATTEMPTS) {
                // Update UI to show retry status
                updateStatusUI('checking', `Connection failed. Retrying (${retryCount}/${API_RETRY_ATTEMPTS})...`);
                // Wait before next retry
                await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY_MS));
            } else {
                // All retries failed
                apiOnline = false;
                updateStatusUI('offline', `API is offline: ${error.message}. Please check the server.`);
            }
        }
    }
}

/**
 * Update the API status indicator UI
 */
function updateStatusUI(status, message = null) {
    // Remove all status classes
    elements.statusIndicator.classList.remove('online', 'offline');
    
    switch (status) {
        case 'online':
            elements.statusIndicator.classList.add('online');
            elements.statusText.textContent = message || 'API is online';
            break;
        case 'offline':
            elements.statusIndicator.classList.add('offline');
            elements.statusText.textContent = message || 'API is offline';
            break;
        case 'checking':
            elements.statusText.textContent = 'Checking API status...';
            break;
    }
}

/**
 * Validate the input text
 */
function validateInput(text) {
    if (!text) {
        return { valid: false, message: 'Please enter some text to check' };
    }
    
    if (text.length > MAX_TEXT_LENGTH) {
        return { 
            valid: false, 
            message: `Text is too long (${text.length} characters). Maximum allowed is ${MAX_TEXT_LENGTH} characters.` 
        };
    }
    
    // Additional validation rules could be added here
    
    return { valid: true };
}

/**
 * Handle the form submission
 */
async function handleSubmit() {
    const text = elements.messageInput.value.trim();
    
    // Validate input
    const validation = validateInput(text);
    if (!validation.valid) {
        showError(validation.message);
        elements.resultsSection.classList.remove('hidden');
        return;
    }
    
    if (!apiOnline) {
        // Try to check API status again
        updateStatusUI('checking', 'Checking API availability...');
        await checkApiStatus();
        
        if (!apiOnline) {
            showError('Cannot check text when the API is offline. Please ensure the backend server is running.');
            elements.resultsSection.classList.remove('hidden');
            return;
        }
    }
    
    setLoading(true);
    elements.resultsSection.classList.remove('hidden');
    
    try {
        const prediction = await checkText(text);
        updateResultsUI(prediction, text);
        addToHistory(text, prediction);
    } catch (error) {
        console.error('Prediction Error:', error);
        
        let errorMessage = error.message;
        
        // Provide more helpful error messages based on error type
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. The server may be overloaded.';
        } else if (error.name === 'TypeError' && errorMessage.includes('Failed to fetch')) {
            errorMessage = 'Could not connect to the server. Please check your network connection.';
            // API might be down, update status
            apiOnline = false;
            updateStatusUI('offline', 'Connection to API lost');
        } else if (error.statusCode === 400) {
            errorMessage = 'Invalid input: ' + errorMessage;
        } else if (error.statusCode === 500) {
            errorMessage = 'Server error: The system encountered a problem processing your request.';
        }
        
        showError(errorMessage);
    } finally {
        setLoading(false);
    }
}

/**
 * Send text to the API for prediction with timeout
 */
async function checkText(text) {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    
    try {
        const response = await fetch(`${API_PREFIX}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
            signal: controller.signal
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.detail || `API error: ${response.status} ${response.statusText}`);
            error.statusCode = response.status;
            throw error;
        }
        
        const data = await response.json();
        
        // Ensure the prediction is properly handled
        if (data.prediction === undefined || data.prediction === null) {
            throw new Error('API returned an invalid prediction format');
        }
        
        return data.prediction;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. The server may be overloaded.');
        }
        throw error;
    }
}

/**
 * Update the loading state of the UI
 */
function setLoading(loading) {
    isLoading = loading;
    elements.checkButton.disabled = loading;
    
    if (loading) {
        elements.buttonText.textContent = 'Checking...';
        elements.buttonLoading.classList.remove('hidden');
    } else {
        elements.buttonText.textContent = 'Check Text';
        elements.buttonLoading.classList.add('hidden');
    }
}

/**
 * Update the results UI based on prediction
 */
function updateResultsUI(prediction, text) {
    elements.resultIcon.className = ''; // Clear previous icon classes
    elements.resultIcon.parentElement.className = 'result-icon'; // Reset parent class
    
    // Normalize prediction to boolean
    const isScam = Boolean(prediction);
    
    if (isScam) {
        elements.resultIcon.className = 'fas fa-exclamation-triangle';
        elements.resultIcon.parentElement.classList.add('danger');
        elements.resultMessage.innerHTML = `
            <strong>Warning: This text appears to be a SCAM!</strong>
            <p>Be extremely cautious about responding or sharing personal information.</p>
        `;
    } else {
        elements.resultIcon.className = 'fas fa-check-circle';
        elements.resultIcon.parentElement.classList.add('success');
        elements.resultMessage.innerHTML = `
            <strong>This text appears to be legitimate.</strong>
            <p>However, always exercise caution with unsolicited messages.</p>
        `;
    }
    
    // Add confidence note
    const confidenceNote = document.createElement('p');
    confidenceNote.className = 'confidence-note';
    confidenceNote.style.fontSize = '12px';
    confidenceNote.style.marginTop = '10px';
    confidenceNote.style.fontStyle = 'italic';
    confidenceNote.textContent = 'Note: This is an automated analysis and may not be 100% accurate.';
    elements.resultMessage.appendChild(confidenceNote);
}

/**
 * Show an error message in the results area
 */
function showError(message) {
    elements.resultIcon.className = 'fas fa-exclamation-circle';
    elements.resultIcon.parentElement.className = 'result-icon danger';
    
    const errorTitle = document.createElement('strong');
    errorTitle.textContent = 'Error: ';
    
    const errorMessage = document.createElement('span');
    errorMessage.textContent = message;
    
    const helpText = document.createElement('p');
    helpText.style.marginTop = '10px';
    helpText.style.fontSize = '14px';
    
    if (message.includes('offline') || message.includes('connect')) {
        helpText.innerHTML = 'Try: <ul>' +
            '<li>Checking that the backend server is running</li>' +
            '<li>Refreshing the page</li>' +
            '<li>Checking your network connection</li>' +
            '</ul>';
    } else if (message.includes('timed out')) {
        helpText.innerHTML = 'Try: <ul>' +
            '<li>Checking if the server is overloaded</li>' +
            '<li>Trying again in a few moments</li>' +
            '</ul>';
    } else if (message.includes('too long')) {
        helpText.innerHTML = 'Try: <ul>' +
            '<li>Reducing the length of your text</li>' +
            '<li>Breaking it into smaller chunks</li>' +
            '</ul>';
    }
    
    elements.resultMessage.innerHTML = '';
    elements.resultMessage.appendChild(errorTitle);
    elements.resultMessage.appendChild(errorMessage);
    elements.resultMessage.appendChild(helpText);
}

/**
 * Add a prediction to the history
 */
function addToHistory(text, prediction) {
    const historyItem = {
        text,
        prediction,
        timestamp: new Date().toISOString()
    };
    
    // Get existing history
    let history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    
    // Add new item to the beginning
    history.unshift(historyItem);
    
    // Limit the number of items
    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    // Save back to localStorage
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    
    // Update the UI
    displayHistory(history);
}

/**
 * Load history from localStorage
 */
function loadHistoryFromStorage() {
    const history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    displayHistory(history);
}

/**
 * Display the history in the UI
 */
function displayHistory(history) {
    if (history.length === 0) {
        elements.historyList.innerHTML = '<p class="empty-history">No history yet. Check some text to see it here.</p>';
        return;
    }
    
    elements.historyList.innerHTML = '';
    
    history.forEach(item => {
        const isScam = item.prediction === 1 || item.prediction === true || item.prediction === 'true' || item.prediction === 'scam';
        const historyClass = isScam ? 'scam' : 'legitimate';
        const resultText = isScam ? 'SCAM' : 'Legitimate';
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleString();
        
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${historyClass}`;
        historyItem.innerHTML = `
            <div class="history-text">${item.text}</div>
            <div class="history-result">Result: <span>${resultText}</span></div>
            <div class="history-time">${formattedDate}</div>
        `;
        
        elements.historyList.appendChild(historyItem);
    });
}

