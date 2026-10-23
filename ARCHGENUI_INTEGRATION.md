# ArchGen 3D UI Integration

## Overview
The ArchGen 3D UI has been integrated as the main frontend interface for the floor-plan-to-3d project. The UI provides a modern React-based interface with authentication, profile management, and seamless integration with the backend AI parser.

## System Architecture

### Services Running
1. **ArchGen 3D UI** (Port 5173) - Main React frontend with Firebase authentication
2. **Backend AI Parser** (Port 8080) - Main floor plan processing and 3D viewer
3. **Recommendation API** (Port 8000) - AI-powered recommendation engine

### User Flow
1. User opens ArchGen 3D UI at `http://localhost:5173`
2. User logs in or registers using Firebase authentication
3. User navigates to "AI Parse" from the navbar
4. **Auto-redirect**: The AI Parse page automatically redirects to `http://localhost:8080`
5. User uploads floor plan and processes it on the backend
6. User views 3D models and gets AI recommendations

## Key Changes Made

### 1. Modified AIParsePage.jsx
- **File**: `archgenui/src/pages/AIParsePage.jsx`
- **Change**: Removed the entire AI parser UI and replaced it with an auto-redirect to `http://localhost:8080`
- **Purpose**: When authenticated users click "AI Parse", they're immediately taken to the actual backend processing page
- **Implementation**: Uses React's `useEffect` hook to redirect on component mount

### 2. Updated run.bat
- **File**: `run.bat` (root directory)
- **Changes**:
  - Added Step 7 to start ArchGen UI on port 5173
  - Updated service descriptions to clarify ArchGen UI as the main interface
  - Modified the system access HTML to highlight ArchGen UI as the primary entry point
  - Changed the auto-open URL to `http://localhost:5173` instead of `http://localhost:8080`
  - Updated instructions to guide users through the new flow

### 3. Created START_ARCHGENUI.bat
- **File**: `archgenui/START_ARCHGENUI.bat`
- **Purpose**: Standalone script to start only the ArchGen UI
- **Features**:
  - Checks for node_modules and installs dependencies if missing
  - Starts Vite dev server on port 5173
  - Shows local and network URLs

## How to Run

### Option 1: Start Everything (Recommended)
```batch
run.bat
```
This will start all services:
- Main backend (8080)
- Recommendation API (8000)
- Recommendation Frontend (5173)
- ArchGen 3D UI (5173)

### Option 2: Start Only ArchGen UI
```batch
cd archgenui
START_ARCHGENUI.bat
```

## Authentication System

### Firebase Configuration
- **Project**: archgen-3d
- **Authentication Methods**: Email/Password, Google Sign-In
- **Database**: Firebase Realtime Database
- **Storage**: User profiles stored as base64-encoded JSON

### Protected Routes
- `/ai-parse` - Requires authentication (redirects to login if not authenticated)
- `/profile` - Requires authentication

### Public Routes
- `/` - Home page
- `/ar-vr` - AR/VR features
- `/about` - About page
- `/contact` - Contact form
- `/login` - Login/Register page

## Important Notes

### Port Configuration
- **ArchGen UI**: 5173 (Vite default)
- **Backend**: 8080 (Flask server)
- **Recommendation API**: 8000 (FastAPI)

### Backend Integration
- The AI Parse page now acts as a navigation bridge
- Users must be authenticated to access the AI Parse route
- After authentication, users are redirected to the backend at `http://localhost:8080`
- All floor plan processing happens on the backend
- Results are displayed in the backend's 3D viewer

### No Code Changes to Backend
- The backend at port 8080 remains unchanged
- No modifications to the recommendation system
- No changes to the AI processing pipeline
- The integration is purely at the routing/navigation level

## Troubleshooting

### ArchGen UI Won't Start
1. Check if port 5173 is available
2. Install dependencies: `cd archgenui && npm install`
3. Check for Node.js version (requires Node 16+)

### Auto-Redirect Not Working
1. Ensure the backend is running on port 8080
2. Check browser console for errors
3. Verify the user is authenticated before accessing `/ai-parse`

### Authentication Issues
1. Check Firebase configuration in `archgenui/src/firebase.js`
2. Verify Firebase project is active
3. Check browser console for Firebase errors

## Future Enhancements

### Potential Improvements
1. **Embedded Backend**: Instead of redirecting, embed the backend viewer in an iframe
2. **Backend API Integration**: Call backend APIs directly from the UI
3. **State Persistence**: Store processing results in Firebase for history
4. **Real-time Updates**: Use WebSockets for live processing status

### Recommended Structure
```
User Login (ArchGen UI) 
  → AI Parse Page (ArchGen UI)
    → Backend Viewer (Embedded or Redirect)
      → Processing Complete
        → Results Saved to Firebase
          → View in ArchGen UI History
```

## File Structure

```
floor-plan-to-3d/
├── archgenui/                          # ArchGen 3D UI (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   └── AIParsePage.jsx        # Modified: Auto-redirects to backend
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx     # Authentication guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Firebase auth context
│   │   ├── firebase.js                # Firebase configuration
│   │   └── App.jsx                    # Routes configuration
│   ├── START_ARCHGENUI.bat            # New: Standalone startup script
│   └── package.json
├── server/
│   └── main.py                        # Backend Flask server (Port 8080)
├── Recommendation/
│   └── backend/
│       └── app.py                     # FastAPI server (Port 8000)
├── run.bat                            # Modified: Starts all services
└── ARCHGENUI_INTEGRATION.md           # This file
```

## Testing Checklist

- [ ] Run `run.bat` successfully
- [ ] ArchGen UI loads at `http://localhost:5173`
- [ ] User can register with email/password
- [ ] User can login with email/password
- [ ] User can login with Google
- [ ] Navigate to AI Parse page
- [ ] Auto-redirect works to `http://localhost:8080`
- [ ] Backend loads correctly
- [ ] User can upload floor plan
- [ ] 3D processing works
- [ ] User can view results

## Contact & Support

For issues or questions about the integration:
1. Check the browser console for errors
2. Check the terminal windows for backend errors
3. Review this document for common issues
4. Verify all ports are available (5173, 8080, 8000)
