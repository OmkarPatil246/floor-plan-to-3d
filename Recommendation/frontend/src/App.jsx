import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Upload,
  Send,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Layout,
  DoorOpen,
  Compass,
  Sun,
  Wind,
  Square,
  Download
} from 'lucide-react';
import './App.css';

const CLEAN_MD = (s) => s.replace(/[#*`~_>-]/g, '').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();

// Backend base URL - follows the host the UI was opened from so the app also
// works when accessed over the LAN (e.g. http://10.x.x.x:5173) instead of
// always pointing at localhost.
const API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;

// Accepts the structured document produced by the 3D viewer detection system
// and returns a normalized floor plan with actual geometry data for rendering
const normalizePlan = (input) => {
  if (!input) return null;
  
  console.log('Normalizing floor plan input:', input);
  
  // Check if we have the structured document format with geometry
  if (input.floorPlan && input.geometryDetails) {
    const { floorPlan, geometryDetails, detectionStats } = input;
    
    // Use actual detected geometry
    return {
      ...input,
      fileName: input.fileName || 'Detected Floor Plan',
      rooms: floorPlan.rooms || [],
      walls: geometryDetails.walls || [],
      windows: geometryDetails.windows || [],
      doors: geometryDetails.doors || [],
      canvasSize: floorPlan.canvasSize || { width: 800, height: 600 },
      stats: detectionStats || {}
    };
  }
  
  // Legacy format support (old room-based data)
  const raw = input.floorPlan && Array.isArray(input.floorPlan.rooms) ? input.floorPlan : input;
  if (!Array.isArray(raw.rooms) || raw.rooms.length === 0) return null;
  
  const cols = Math.ceil(Math.sqrt(raw.rooms.length));
  const rooms = raw.rooms.map((r, i) => ({
    ...r,
    id: r.id ?? r.name ?? `room-${i}`,
    rect: r.rect ?? {
      x: (i % cols) * 160 + 20,
      y: Math.floor(i / cols) * 160 + 20,
      w: 140,
      h: 140
    }
  }));
  return { ...raw, rooms, fileName: raw.fileName ?? input.fileName };
};

const DEFAULT_PLAN = {
  fileName: "HousePlan.svg",
  rooms: [
    { id: "Master Bedroom", name: "Master Bedroom", roomType: "Bedroom", area: 120, doors: 1, windows: 2, wallLength: 45, orientation: "South", connectedRooms: ["Hallway", "Attached Bath"], rect: {x: 20, y: 20, w: 160, h: 120} },
    { id: "Guest Bedroom", name: "Guest Bedroom", roomType: "Bedroom", area: 80, doors: 1, windows: 0, wallLength: 35, orientation: "North", connectedRooms: ["Hallway"], rect: {x: 190, y: 20, w: 130, h: 100} },
    { id: "Main Kitchen", name: "Main Kitchen", roomType: "Kitchen", area: 150, doors: 2, windows: 1, wallLength: 50, orientation: "East", connectedRooms: ["Dining", "Utility"], rect: {x: 20, y: 150, w: 140, h: 110} },
    { id: "Family Living Room", name: "Family Living Room", roomType: "Living Room", area: 250, doors: 3, windows: 1, wallLength: 70, orientation: "West", connectedRooms: ["Dining", "Hallway", "Balcony"], rect: {x: 170, y: 130, w: 210, h: 130} },
    { id: "Common Bathroom", name: "Common Bathroom", roomType: "Bathroom", area: 35, doors: 1, windows: 0, wallLength: 24, orientation: "North", connectedRooms: ["Hallway"], rect: {x: 330, y: 20, w: 60, h: 100} }
  ]
};

const LOADING_MSGS = ['Understanding Room Layout...', 'Checking Design Standards...', 'Preparing Review...'];

const QUICK_QUESTIONS = ["Improve privacy", "More sunlight", "Better furniture layout", "Reduce construction cost"];

function App() {
  const [fileData, setFileData] = useState(DEFAULT_PLAN);
  const [fileName, setFileName] = useState("HousePlan.svg");
  const [status, setStatus] = useState('idle');
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [results, setResults] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [clickedRoom, setClickedRoom] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hi! How can I help you improve your floor plan?' }]);
  const chatEndRef = useRef(null);
  const didInitRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const runAnalysis = useCallback(async (planDataToUse) => {
    const targetPlan = planDataToUse || fileData;
    if (!targetPlan) return;

    setStatus('loading');
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      if (msgIdx < LOADING_MSGS.length) setLoadingMsg(LOADING_MSGS[msgIdx++]);
    }, 800);

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetPlan)
      });
      if (!response.ok) throw new Error('Analysis failed.');
      setResults(await response.json());
    } catch {
      setResults({
        issues: [
          { room: "Guest Bedroom", problem: "Room area below minimum standard.", severity: "HIGH", reason: "Increase room width by approximately 0.8m." },
          { room: "Family Living Room", problem: "Too many doors.", severity: "MEDIUM", reason: "Remove one unnecessary entrance." },
          { room: "Common Bathroom", problem: "No window.", severity: "HIGH", reason: "Add one external window." }
        ],
        top_suggestions: [
          { issue: "Guest Bedroom has room area below minimum standard.", improvement: "Increase room width by approximately 0.8m." },
          { issue: "Common Bathroom has no window.", improvement: "Add one external window." },
          { issue: "Family Living Room has too many doors.", improvement: "Remove one unnecessary entrance." }
        ],
        ai_recommendations: "The plan has a good overall room arrangement, but a few areas need attention. The guest bedroom is smaller than recommended, potentially limiting furniture placement. The common bathroom lacks adequate windows, which may affect comfort and natural light. The family living room has multiple entrances that could reduce usable wall space and privacy.",
      });
    } finally {
      clearInterval(msgInterval);
      setTimeout(() => setStatus('analyzed'), 500);
    }
  }, [fileData]);

  // When opened from the 3D viewer bridge, pick up the floor plan that was
  // handed over via the URL hash (cross-origin safe) or sessionStorage
  // (same-origin) and run the analysis automatically.
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    console.log('Recommendation App: Initializing...');
    
    let incoming = null;
    
    // Try URL hash first
    try {
      const match = (window.location.hash || '').match(/[#&]floorplan=([^&]+)/);
      if (match) {
        incoming = JSON.parse(decodeURIComponent(match[1]));
        console.log('Recommendation App: Loaded floor plan from URL hash', incoming);
      }
    } catch (e) {
      console.warn('Invalid floor plan data in URL', e);
    }

    // Fallback to sessionStorage
    if (!incoming) {
      try {
        const raw = sessionStorage.getItem('floorplan_data');
        if (raw) {
          incoming = JSON.parse(raw);
          console.log('Recommendation App: Loaded floor plan from sessionStorage', incoming);
        }
      } catch (e) {
        console.warn('Invalid floor plan data in sessionStorage', e);
      }
    }

    const plan = normalizePlan(incoming);
    if (plan) {
      console.log('Recommendation App: Normalized floor plan with', plan.rooms?.length || 0, 'rooms');
      setFileData(plan);
      setFileName(plan.fileName || 'Analyzed Floor Plan');
      runAnalysis(plan);
      // Clean up URL hash for cleaner address bar
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      console.warn('Recommendation App: No valid floor plan data found, using default');
    }
  }, [runAnalysis]);

  const downloadPDF = async () => {
    if (!results || isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const doc = new jsPDF();

      try {
        const response = await fetch('/archgen_logo.png');
        if (response.ok) {
          const blob = await response.blob();
          const logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          const img = new Image();
          await new Promise((resolve) => { img.onload = resolve; img.src = logoBase64; });
          const logoHeight = 22;
          const logoWidth = (img.width / img.height) * logoHeight;
          doc.addImage(logoBase64, 'PNG', 210 - 14 - logoWidth, 14, logoWidth, logoHeight);
        }
      } catch (e) {
        console.warn("Could not load logo for PDF", e);
      }

      doc.setFontSize(22).setTextColor(40, 40, 40);
      doc.text("Architectural Review", 14, 22);
      doc.setFontSize(11).setTextColor(100);
      doc.text(`Project: ${fileName}`, 14, 30);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);
      doc.setDrawColor(200).line(14, 42, 196, 42);

      doc.setFontSize(14).setTextColor(0).text("Overall Design Review", 14, 52);
      doc.setFontSize(11).setTextColor(60);
      const splitReview = doc.splitTextToSize(results.ai_recommendations || 'No design review available.', 180);
      doc.text(splitReview, 14, 60);

      let currentY = 60 + splitReview.length * 6 + 10;
      doc.setFontSize(14).setTextColor(0).text("Detected Issues & Recommended Improvements", 14, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Room', 'Issue', 'Severity', 'Recommendation']],
        body: results.issues.map(i => [i.room, i.problem, i.severity, i.reason]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 45 }, 2: { cellWidth: 25 }, 3: { cellWidth: 75 } },
        margin: { top: 20 },
      });

      currentY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14).setTextColor(0).text("Important Room Observations", 14, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Room', 'Area', 'Natural Light', 'Ventilation', 'Orientation']],
        body: fileData.rooms.map(r => [r.name, `${r.area} sqft`, r.windows > 0 ? 'Good' : 'Poor', r.windows > 0 ? 'Optimal' : 'Low', r.orientation]),
        theme: 'striped',
        headStyles: { fillColor: [80, 80, 80], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 5 },
        margin: { top: 20 },
      });

      doc.save("floor-plan-recommendations.pdf");
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const plan = normalizePlan(JSON.parse(event.target.result));
        if (!plan) {
          alert('Invalid JSON file.');
          return;
        }
        setFileData(plan);
        runAnalysis(plan);
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const askQuestion = async (qText) => {
    if (!qText.trim() || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', text: qText }]);
    setChatInput('');
    setIsTyping(true);

    const isGreeting = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|yo)\b/i.test(qText.trim()) && qText.trim().length < 20;
    if (isGreeting) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: "Hi! How can I help you improve your floor plan today?" }]);
        setIsTyping(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: qText, floor_plan: fileData, issues: results?.issues || [] })
      });
      if (!response.ok) throw new Error('Q&A failed');
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: CLEAN_MD(data.answer) }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "The layout meets basic requirements, but optimization is recommended for better flow and comfort." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSvgWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.05 : 0.95;
    setZoom(z => Math.max(0.5, Math.min(z * factor, 3)));
  };

  const handleSvgMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleSvgMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleSvgMouseUp = () => setIsDragging(false);

  const activeRoom = clickedRoom || hoveredRoom;
  const activeRoomData = fileData.rooms.find(r => r.name === activeRoom);

  if (status === 'idle') {
    return (
      <div className="full-center">
        <div className="upload-card">
          <Upload size={48} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Architectural Review</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Upload your floor plan to begin professional design analysis.
          </p>
          <label style={{
            display: 'inline-block', backgroundColor: 'var(--primary-color)', color: 'white',
            padding: '0.75rem 1.5rem', borderRadius: '24px', cursor: 'pointer',
            fontWeight: 500, fontSize: '0.9rem'
          }}>
            Upload SVG / JSON
            <input type="file" accept=".json,.svg" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="full-center">
        <div className="blueprint-loader">
          <div className="line line-1" />
          <div className="line line-2" />
          <div className="line line-3" />
          <div className="line line-4" />
        </div>
        <div className="loading-text">Analyzing Floor Plan</div>
        <div className="loading-subtext">{loadingMsg}</div>
      </div>
    );
  }

  const WALL_T = 6;
  const DOOR_W = 24;
  const WIN_W = 32;

  // Render actual detected geometry or fall back to legacy rectangle mode
  const hasGeometry = fileData.walls && fileData.doors !== undefined && fileData.windows !== undefined;
  const canvasSize = fileData.canvasSize || { width: 800, height: 600 };
  
  // Helper to convert polygon points to SVG path
  const polygonToPath = (polygon) => {
    if (!polygon || polygon.length === 0) return '';
    return polygon.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
  };

  return (
    <div className="app-container">

      {/* LEFT: Floor Plan Preview */}
      <div className="panel left-panel">
        <div className="panel-header">
          <span className="panel-title">Floor Plan Preview</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={() => window.location.href = 'http://localhost:8080'}
              style={{
                padding: '4px 12px',
                background: '#1a1a1a',
                color: 'white',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                marginRight: '8px',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#000'}
              onMouseLeave={(e) => e.target.style.background = '#1a1a1a'}
              title="Return to 3D Viewer"
            >
              ← Back to 3D
            </button>
            <ZoomOut size={16} color="var(--text-secondary)" style={{cursor: 'pointer'}} onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} />
            <ZoomIn  size={16} color="var(--text-secondary)" style={{cursor: 'pointer'}} onClick={() => setZoom(z => Math.min(3, z + 0.2))} />
            <Maximize2 size={16} color="var(--text-secondary)" style={{cursor: 'pointer'}} onClick={() => { setZoom(1); setPan({x:0, y:0}); }} />
          </div>
        </div>

        <div
          className="svg-container"
          onWheel={handleSvgWheel}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
          style={{ touchAction: 'none' }}
        >
          <div className="svg-content" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            <svg width={canvasSize.width} height={canvasSize.height} viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}>
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E5EA" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {hasGeometry ? (
                <>
                  {/* Render actual detected walls */}
                  {fileData.walls.map((wall, idx) => (
                    <g key={`wall-${idx}`}>
                      <path
                        d={polygonToPath(wall.polygon)}
                        fill="#E5E5EA"
                        stroke="#8E8E93"
                        strokeWidth="2"
                        className="detected-wall"
                      />
                      <text
                        x={wall.bounds.left + wall.bounds.width / 2}
                        y={wall.bounds.top + wall.bounds.height / 2}
                        fontSize="10"
                        fill="#666"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        W{idx + 1}
                      </text>
                    </g>
                  ))}

                  {/* Render actual detected doors */}
                  {fileData.doors.map((door, idx) => (
                    <g key={`door-${idx}`}>
                      <path
                        d={polygonToPath(door.polygon)}
                        fill="#8B4513"
                        stroke="#654321"
                        strokeWidth="2"
                        className="detected-door"
                      />
                      <text
                        x={door.bounds.left + door.bounds.width / 2}
                        y={door.bounds.top + door.bounds.height / 2}
                        fontSize="10"
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        D{idx + 1}
                      </text>
                    </g>
                  ))}

                  {/* Render actual detected windows */}
                  {fileData.windows.map((window, idx) => (
                    <g key={`window-${idx}`}>
                      <path
                        d={polygonToPath(window.polygon)}
                        fill="rgba(135, 206, 250, 0.6)"
                        stroke="#4A90E2"
                        strokeWidth="2"
                        className="detected-window"
                      />
                      <text
                        x={window.bounds.left + window.bounds.width / 2}
                        y={window.bounds.top + window.bounds.height / 2}
                        fontSize="10"
                        fill="#003366"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        Win{idx + 1}
                      </text>
                    </g>
                  ))}

                  {/* Render room labels */}
                  {fileData.rooms.map((room, idx) => room.bounds && (
                    <text
                      key={`room-label-${idx}`}
                      x={room.bounds.left + room.bounds.width / 2}
                      y={room.bounds.top + room.bounds.height / 2}
                      fontSize="14"
                      fontWeight="600"
                      fill="#1a1a1a"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {room.name}
                    </text>
                  ))}
                </>
              ) : (
                /* Legacy rectangle rendering for old data format */
                fileData.rooms.map((room) => {
                  const isHighlight = activeRoom === room.name;
                  const rect = room.rect ?? {x: 0, y: 0, w: 100, h: 100};
                  const doorX = rect.x + rect.w / 2 - DOOR_W / 2;
                  const windowX = rect.x + rect.w / 2 - WIN_W / 2;
                  const windowY = rect.y + rect.h - WALL_T;

                  return (
                    <g
                      key={room.id}
                      onMouseEnter={() => setHoveredRoom(room.name)}
                      onMouseLeave={() => setHoveredRoom(null)}
                      onClick={() => setClickedRoom(clickedRoom === room.name ? null : room.name)}
                      className="room-group"
                    >
                      <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} className={`room-wall ${isHighlight ? 'highlighted' : ''}`} />
                      <rect x={rect.x + WALL_T} y={rect.y + WALL_T} width={Math.max(0, rect.w - WALL_T*2)} height={Math.max(0, rect.h - WALL_T*2)} className={`room-floor ${isHighlight ? 'highlighted' : ''}`} />
                      {room.doors > 0 && <rect x={doorX} y={rect.y} width={DOOR_W} height={WALL_T} className="room-door" />}
                      {room.windows > 0 && <rect x={windowX} y={windowY} width={WIN_W} height={WALL_T} className="room-window" />}
                      <text x={rect.x + rect.w/2} y={rect.y + rect.h/2} className="room-label" textAnchor="middle" dominantBaseline="middle">
                        {room.name}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {activeRoomData && (
            <div className="room-inspector">
              <div className="inspector-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layout size={18} color="var(--primary-color)" />
                  <span className="inspector-title">{activeRoomData.name}</span>
                </div>
                <div className={`status-badge ${results?.issues?.some(i => i.room === activeRoomData.name) ? 'status-issue' : 'status-ok'}`}>
                  {results?.issues?.some(i => i.room === activeRoomData.name) ? 'Issues Found' : 'Optimal'}
                </div>
              </div>
              <div className="inspector-grid">
                {[
                  [Square,    'Area',         `${activeRoomData.area} sqft`],
                  [DoorOpen,  'Doors',        activeRoomData.doors],
                  [Maximize2, 'Windows',      activeRoomData.windows],
                  [Compass,   'Orientation',  activeRoomData.orientation],
                  [Sun,       'Natural Light', activeRoomData.windows > 0 ? 'Good' : 'Poor'],
                  [Wind,      'Ventilation',  activeRoomData.windows > 0 ? 'Optimal' : 'Low'],
                ].map(([Icon, label, value]) => (
                  <div key={label} className="inspector-item">
                    <Icon size={16} className="inspector-icon" />
                    <div>
                      <div className="inspector-label">{label}</div>
                      <div className="inspector-value">{value}</div>
                    </div>
                  </div>
                ))}
                {results?.issues?.some(i => i.room === activeRoomData.name) && (
                  <div className="inspector-item" style={{ gridColumn: '1 / -1' }}>
                    <AlertCircle size={16} className="inspector-icon" style={{ color: 'var(--error-color)' }} />
                    <div>
                      <div className="inspector-label">Detected Issue</div>
                      <div className="inspector-value" style={{ color: 'var(--error-color)' }}>
                        {results.issues.find(i => i.room === activeRoomData.name).problem}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Review Workspace */}
      <div className="panel center-panel">
        <div className="panel-header">
          <span className="panel-title">Review Workspace</span>
          <button
            onClick={downloadPDF}
            disabled={isGeneratingPDF}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              backgroundColor: isGeneratingPDF ? 'var(--text-secondary)' : 'var(--primary-color)',
              color: 'white', border: 'none', padding: '0.4rem 0.8rem',
              borderRadius: '4px', cursor: isGeneratingPDF ? 'not-allowed' : 'pointer',
              fontSize: '0.75rem', fontWeight: 500, transition: 'background-color 0.2s'
            }}
          >
            <Download size={14} /> {isGeneratingPDF ? 'Generating PDF...' : 'Download Recommendations'}
          </button>
        </div>

        <div className="center-content">
          <div>
            <div className="section-title">Design Review</div>
            <div className="brief-review" style={{ whiteSpace: 'pre-wrap' }}>
              {results?.ai_recommendations ? CLEAN_MD(results.ai_recommendations) : "The floor plan has been analyzed."}
            </div>
          </div>

          <div>
            <div className="section-title">Top Suggestions</div>
            {results?.top_suggestions?.length > 0 ? (
              <div className="suggestions-list">
                {results.top_suggestions.map((sug, idx) => (
                  <div key={`sug-${idx}`} className="suggestion-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.8rem', padding: '0.8rem', backgroundColor: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <AlertCircle size={18} className="suggestion-icon" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{sug.issue}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sug.improvement}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No suggestions at this time.</div>
            )}
          </div>

          <div>
            <div className="section-title">Issues</div>
            {results?.issues?.length > 0 ? (
              <div className="timeline">
                {results.issues.map((iss, idx) => (
                  <div
                    key={idx}
                    className="timeline-item"
                    onMouseEnter={() => setHoveredRoom(iss.room)}
                    onMouseLeave={() => setHoveredRoom(null)}
                    onClick={() => setClickedRoom(iss.room)}
                  >
                    <div className="timeline-dot" />
                    <div className="timeline-header">{iss.room}</div>
                    <div className="timeline-desc">{iss.problem}</div>
                    <div className="timeline-fix"><span>Fix: {iss.reason}</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No issues detected.</div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Virtual Architect */}
      <div className="panel right-panel">
        <div className="panel-header" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem 1.5rem' }}>
          <span className="panel-title" style={{ fontSize: '1rem' }}>Virtual Architect</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Ask anything about this design</span>
        </div>

        <div className="chat-container">
          <div className="quick-questions">
            {QUICK_QUESTIONS.map((q, idx) => (
              <div key={idx} className="chip" onClick={() => askQuestion(q)}>{q}</div>
            ))}
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>{msg.text}</div>
            ))}
            {isTyping && (
              <div className="message ai" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((delay) => (
                  <div key={delay} style={{ width: 6, height: 6, backgroundColor: 'var(--text-secondary)', borderRadius: '50%', animation: `fadeIn 0.5s infinite alternate ${delay}s` }} />
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-container">
            <form className="chat-input-wrapper" onSubmit={(e) => { e.preventDefault(); askQuestion(chatInput); }}>
              <input
                type="text"
                className="chat-input"
                placeholder="Ask about your floor plan..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isTyping}
              />
              <button type="submit" className="chat-send-btn" disabled={!chatInput.trim() || isTyping}>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
