# Changelog

All notable changes to the Scam Filter project will be documented in this file.

## [1.0.0] - 2025-05-07

### Added

#### Frontend
- Created new responsive dashboard interface with HTML, CSS, and JavaScript
- Implemented text input area with validation for scam checking
- Added results display with visual indicators for scam/legitimate messages
- Created history section that stores previous checks in localStorage
- Added API status indicator to show backend connectivity
- Implemented loading states for improved user experience
- Added comprehensive error handling with helpful messages
- Created confidence score display for prediction results

#### Backend
- Added CORS middleware to allow cross-origin requests
- Implemented input validation with Pydantic models
- Added proper error handling throughout the API
- Created health check endpoint for monitoring API status
- Enhanced API response format with standardized boolean predictions
- Added confidence scores to prediction responses
- Implemented comprehensive logging for debugging and monitoring
- Added parameter validation with type hints and Pydantic validators

#### Integration
- Combined frontend and backend into a single integrated service
- Modified API to serve static frontend files from the root path
- Created API router with /api prefix for all endpoints
- Implemented proper path handling for static files
- Added redirects from root to frontend index.html
- Updated frontend to use relative API paths

### Changed
- Standardized API responses to return boolean values for predictions
- Improved error handling across both frontend and backend
- Enhanced text validation to provide better user feedback
- Updated API documentation to reflect new integrated structure
- Modified frontend paths to work with the integrated service

### Fixed
- Resolved issues with API communication error handling
- Fixed path references in HTML and JavaScript files
- Addressed CORS issues for local development
- Improved response handling for different prediction formats

### Documentation
- Created comprehensive README.md with project documentation
- Added detailed CHANGELOG.md to track project updates
- Included installation and usage instructions
- Documented API endpoints and response formats
- Added development guidelines and best practices

## Notes for Developers

### Breaking Changes
- API endpoints now use the `/api` prefix (e.g., `/api/predict` instead of `/predict`)
- Frontend files are now served from the root path rather than requiring a separate server
- Prediction responses now consistently return boolean values and confidence scores

### Important Updates
- The application now serves both frontend and backend from a single service
- Model prediction handling has been improved to normalize different response types
- Environment setup now only requires running the API server, no separate frontend server needed

## Credits

- Development: Iris (Project Owner)
- Documentation: Iris 
- Testing: Iris

