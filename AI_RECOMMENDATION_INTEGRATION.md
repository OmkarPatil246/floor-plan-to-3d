# AI Recommendation System Integration

## Overview
The AI Recommendation feature has been successfully integrated into the Floorplan-to-3D application. This feature analyzes the detected floor plan and provides architectural recommendations and suggestions.

## What Was Added

### 1. Backend Integration

#### New Endpoint: `/generate-recommendation-input`
- **File**: `server/main.py`
- **Purpose**: Generates a structured JSON document from the detection results
- **Method**: POST
- **Input**: Detection result JSON from the viewer
- **Output**: Structured document compatible with the Recommendation system

#### New Module: `structured_document_generator.py`
- **Location**: `server/structured_document_generator.py`
- **Purpose**: Converts polygon detection data into a structured format describing:
  - Rooms (area, type, dimensions)
  - Walls (length, orientation, connections)
  - Windows (count, placement, orientation)
  - Doors (count, placement, orientation)
  - Spatial relationships between elements

### 2. Frontend Integration

#### New Button: "AI Recommendation"
- **Location**: Control panel in `viewer/index.html`
- **Position**: Between "Edit Model" and "Environment" sections
- **Style**: Green gradient button with AI icon
- **Behavior**:
  1. Checks if floor plan has been processed
  2. Generates structured document via backend API
  3. Stores data in sessionStorage
  4. Opens recommendation system in new window

#### New Bridge Page: `recommendation_bridge.html`
- **Location**: `viewer/recommendation_bridge.html`
- **Purpose**: Smooth transition between main viewer and recommendation system
- **Features**:
  - Loading animation
  - Status updates
  - Error handling
  - Automatic redirection to Recommendation frontend

### 3. Data Flow

```
User uploads floor plan
    ↓
Detection runs (Mask R-CNN)
    ↓
Result stored in lastDetectionResult
    ↓
User clicks "Get AI Recommendations"
    ↓
POST to /generate-recommendation-input
    ↓
Structured document generated
    ↓
Data stored in sessionStorage
    ↓
Bridge page opens in new window
    ↓
Redirects to Recommendation frontend
    ↓
Recommendation system reads data from sessionStorage
```

## How to Use

### For Users

1. **Upload a floor plan**: Click "Upload Image" or "Upload SVG" and select your floor plan
2. **Wait for detection**: The system will automatically detect walls, windows, and doors
3. **Get recommendations**: Click the "Get AI Recommendations" button
4. **View results**: A new window will open showing AI-powered recommendations

### For Developers

#### Starting the Recommendation System

The Recommendation system needs to run separately. Navigate to the Recommendation folder and start both backend and frontend:

**Backend (FastAPI)**:
```bash
cd Recommendation/backend
pip install -r requirements.txt
python app.py
```

**Frontend (React + Vite)**:
```bash
cd Recommendation/frontend
npm install
npm run dev
```

#### Data Format

The structured document follows this format:

```json
{
  "floorPlan": {
    "canvasSize": {
      "width": 1000,
      "height": 800
    },
    "totalArea": 45000.5,
    "rooms": [
      {
        "name": "Room 1",
        "roomType": "room",
        "area": 15000.2,
        "doors": 2,
        "windows": 3,
        "wallLength": 500.5,
        "orientation": "horizontal",
        "connectedRooms": []
      }
    ]
  },
  "detectionStats": {
    "wallsDetected": 12,
    "windowsDetected": 8,
    "doorsDetected": 5,
    "roomsIdentified": 3
  },
  "geometryDetails": {
    "walls": [...],
    "windows": [...],
    "doors": [...]
  }
}
```

## Files Modified

1. **server/main.py**
   - Added `/generate-recommendation-input` endpoint
   - Imported `structured_document_generator` module

2. **viewer/index.html**
   - Added "AI Recommendation" button in UI
   - Added JavaScript event handler
   - Added `lastDetectionResult` global variable
   - Modified `fetchAndLoad` to store detection results

## Files Created

1. **server/structured_document_generator.py**
   - Complete module for generating structured documents
   - Functions for calculating areas, perimeters, orientations
   - Room identification logic
   - Connection detection between elements

2. **viewer/recommendation_bridge.html**
   - Beautiful loading page with animations
   - Error handling
   - Automatic redirection
   - Back button functionality

## Features

### ✅ Implemented
- Backend endpoint for generating structured documents
- Structured document generator with full geometry analysis
- UI button in control panel
- Data persistence via sessionStorage
- Bridge page for smooth transitions
- Error handling and user feedback
- Mobile-responsive button design

### 🔄 Integration Points
- Recommendation system reads data from sessionStorage
- Bridge page automatically redirects to frontend
- Back button to return to main viewer

## Testing

### Manual Testing Steps

1. Start the main server:
   ```bash
   python server/main.py
   ```

2. Start the Recommendation backend:
   ```bash
   cd Recommendation/backend
   python app.py
   ```

3. Start the Recommendation frontend:
   ```bash
   cd Recommendation/frontend
   npm run dev
   ```

4. Open the main viewer in browser
5. Upload a floor plan image
6. Wait for detection to complete
7. Click "Get AI Recommendations"
8. Verify bridge page loads
9. Verify redirect to Recommendation system
10. Verify data is available in the Recommendation UI

## Troubleshooting

### Issue: Pop-up blocked
**Solution**: Allow pop-ups for localhost in browser settings

### Issue: Recommendation system not found
**Solution**: Ensure the Recommendation frontend is running and accessible

### Issue: No data in Recommendation system
**Solution**: Check browser console for errors, verify sessionStorage contains 'floorplan_data'

### Issue: "Please upload a floor plan first" message
**Solution**: Upload and process a floor plan before clicking the recommendation button

## Future Enhancements

- Direct backend-to-backend communication (optional)
- Real-time recommendation updates
- Save recommendation history
- Compare multiple floor plans
- Export recommendations as PDF
- Integration with 3D model editing

## Notes

- The integration is non-invasive and doesn't modify the Recommendation project
- Data flows through sessionStorage for simplicity
- Bridge page provides good UX during transition
- All new code is clearly commented
- Mobile-responsive design maintained
