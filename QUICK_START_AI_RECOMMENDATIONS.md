# Quick Start: AI Recommendations Feature

## 🎯 What's New

A **"Get AI Recommendations"** button has been added to the control panel. After processing a floor plan, click this button to get AI-powered architectural recommendations and design suggestions.

## 🚀 How to Use (Simple Steps)

### Step 1: Process a Floor Plan
1. Open the main viewer at `http://localhost:8080`
2. Click **"Upload Image"** or **"Upload SVG"**
3. Select your floor plan file
4. Wait for detection to complete (you'll see walls, windows, and doors detected)

### Step 2: Get Recommendations
1. Click the **"Get AI Recommendations"** button (green button in control panel)
2. A new window will open with a loading screen
3. You'll be automatically redirected to the Recommendation system

### Step 3: View & Explore
- Review AI-generated recommendations
- See room analysis and suggestions
- Ask questions about your floor plan
- Get design improvements

## 📍 Where to Find It

The **"Get AI Recommendations"** button is located in the control panel:
- Below: "Edit Model"
- Above: "Environment"
- Style: Green gradient button with + icon

## ⚙️ Setup Requirements

### Main Viewer (should already be running)
```bash
python server/main.py
# or
python run.bat
```

### Recommendation System

**Backend:**
```bash
cd Recommendation/backend
pip install -r requirements.txt
python app.py
```
- Runs on: `http://localhost:8000`

**Frontend:**
```bash
cd Recommendation/frontend
npm install
npm run dev
```
- Runs on: `http://localhost:5173` (or similar)

## ✅ Features

- **Automatic Analysis**: Analyzes walls, windows, doors, and rooms
- **Structured Data**: Converts 3D model to architectural document
- **Smart Recommendations**: AI-powered suggestions based on building codes and best practices
- **Interactive Q&A**: Ask questions about your floor plan
- **Seamless Integration**: One-click access from main viewer

## 🔧 Technical Details

### What Happens Behind the Scenes

1. **Detection Storage**: When you upload a floor plan, the detection results are automatically stored
2. **Document Generation**: Click the button → backend generates a structured JSON document
3. **Data Transfer**: Document is stored in browser's sessionStorage
4. **Redirect**: New window opens and navigates to Recommendation system
5. **Analysis**: Recommendation system reads the data and displays results

### API Endpoint Added
```
POST /generate-recommendation-input
Input: { detection_result: {...} }
Output: { structured_document: {...}, saved_to: "path" }
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Button disabled | Upload a floor plan first |
| Pop-up blocked | Allow pop-ups in browser settings |
| "No data found" error | Ensure you clicked the button after detection completed |
| Redirect fails | Make sure Recommendation frontend is running |

## 📁 Files Added/Modified

**New Files:**
- `server/structured_document_generator.py` - Converts detection to structured format
- `viewer/recommendation_bridge.html` - Loading/redirect page
- `AI_RECOMMENDATION_INTEGRATION.md` - Full documentation

**Modified Files:**
- `server/main.py` - Added API endpoint
- `viewer/index.html` - Added button and JavaScript handler

## 💡 Tips

- **Best Results**: Use clear, high-resolution floor plans
- **Multiple Plans**: You can process different plans and get recommendations for each
- **Save Results**: The Recommendation system may allow you to export reports
- **Browser Compatibility**: Works best in Chrome, Firefox, Edge

## 🎨 UI Design

The button features:
- Green gradient background (`#10b981` → `#059669`)
- Plus icon for "add recommendations"
- Full-width design for easy clicking
- Mobile-responsive
- Loading state when processing

## 📞 Need Help?

Check the full documentation in `AI_RECOMMENDATION_INTEGRATION.md` for:
- Complete technical details
- Data format specifications
- Advanced troubleshooting
- Architecture diagrams
- Future enhancements

---

**Ready to try it?** Upload a floor plan and click "Get AI Recommendations"! 🚀
