import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import './App.css';

const CLEAN_MD = (s) => s.replace(/[#*`~_>-]/g, '').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;

const LOADING_MSGS = ['Understanding Room Layout...', 'Checking Design Standards...', 'Preparing Review...'];

const QUICK_QUESTIONS = ["Improve privacy", "More sunlight", "Better furniture layout", "Reduce construction cost"];

function App() {
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("HousePlan.svg");
  const [status, setStatus] = useState('idle');
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [results, setResults] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hi! How can I help you improve your floor plan?' }]);
  const [showDetections, setShowDetections] = useState(true);
  const [metrics, setMetrics] = useState(null);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const chatEndRef = useRef(null);
  const didInitRef = useRef(false);
  const svgContainerRef = useRef(null);

  // Extract actual data from fileData (may be wrapped in structured_document)
  const actualData = useMemo(() => {
    return fileData?.structured_document || fileData;
  }, [fileData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Fix for passive event listener warning - attach wheel event with passive: false
  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom(z => Math.max(0.5, Math.min(z * factor, 3)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Calculate metrics from detection data
  const calculateMetrics = useCallback((data) => {
    if (!data) return null;

    const geometryDetails = data.geometryDetails || {};
    const rooms = data.floorPlan?.rooms || [];
    const windows = geometryDetails.windows || [];
    const doors = geometryDetails.doors || [];

    // Calculate total window area and door area
    const totalWindowArea = windows.reduce((sum, w) => sum + (w.area || 0), 0);
    const totalDoorArea = doors.reduce((sum, d) => sum + (d.area || 0), 0);
    const totalRoomArea = rooms.reduce((sum, r) => sum + (r.area || 0), 0);

    // Calculate ventilation score (0-100 based on window/door coverage)
    const openingRatio = totalRoomArea > 0 ? ((totalWindowArea + totalDoorArea) / totalRoomArea) : 0;
    const ventilationScore = Math.min(100, Math.round(openingRatio * 1000));

    // Calculate sunlight score (based on window count and area)
    const avgWindowArea = windows.length > 0 ? totalWindowArea / windows.length : 0;
    const sunlightScore = Math.min(100, Math.round((windows.length * 10) + (avgWindowArea / 10)));

    // Room-by-room metrics
    const roomMetrics = rooms.map(room => {
      const roomWindows = room.windows || 0;
      const roomDoors = room.doors || 0;
      
      return {
        name: room.name,
        area: room.area.toFixed(1),
        windows: roomWindows,
        doors: roomDoors,
        ventilation: roomWindows > 0 ? 'Good' : 'Poor',
        sunlight: roomWindows >= 2 ? 'Excellent' : roomWindows === 1 ? 'Good' : 'Poor',
        privacy: roomDoors === 1 ? 'Good' : roomDoors > 1 ? 'Low' : 'Excellent'
      };
    });

    return {
      overall: {
        ventilation: ventilationScore,
        sunlight: sunlightScore,
        windowCount: windows.length,
        doorCount: doors.length,
        roomCount: rooms.length
      },
      rooms: roomMetrics
    };
  }, []);

  // Draw original image with detection overlays on canvas
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !fileData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Set canvas size to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Get actual data (unwrap if needed)
    const actualData = fileData?.structured_document || fileData;

    // Draw detection overlays if enabled
    if (showDetections && actualData.geometryDetails) {
      const { walls, windows, doors } = actualData.geometryDetails;

      // Helper to draw polygon with label
      const drawPolygon = (polygon, color, label, fillAlpha = 0.3) => {
        if (!polygon || polygon.length === 0) return;

        ctx.beginPath();
        ctx.moveTo(polygon[0][0], polygon[0][1]);
        for (let i = 1; i < polygon.length; i++) {
          ctx.lineTo(polygon[i][0], polygon[i][1]);
        }
        ctx.closePath();

        // Fill with transparency
        ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${fillAlpha})`);
        ctx.fill();

        // Stroke
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label at centroid
        if (label) {
          const centroidX = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
          const centroidY = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;

          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw text with outline
          ctx.strokeText(label, centroidX, centroidY);
          ctx.fillText(label, centroidX, centroidY);
        }
      };

      // Draw walls (gray)
      walls.forEach((wall, idx) => {
        drawPolygon(wall.polygon, 'rgb(150, 150, 150)', `W${idx + 1}`, 0.2);
      });

      // Draw windows (blue)
      windows.forEach((window, idx) => {
        drawPolygon(window.polygon, 'rgb(74, 144, 226)', `Win${idx + 1}`, 0.4);
      });

      // Draw doors (brown)
      doors.forEach((door, idx) => {
        drawPolygon(door.polygon, 'rgb(139, 69, 19)', `D${idx + 1}`, 0.4);
      });
    }
  }, [fileData, showDetections]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      drawCanvas();
    }
  }, [drawCanvas]);

  const runAnalysis = useCallback(async (planDataToUse) => {
    const targetPlan = planDataToUse || fileData;
    if (!targetPlan) return;

    setStatus('loading');
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      if (msgIdx < LOADING_MSGS.length) setLoadingMsg(LOADING_MSGS[msgIdx++]);
    }, 800);

    try {
      // Extract the actual data (unwrap if needed)
      const actualPlanData = targetPlan?.structured_document || targetPlan;
      
      // Backend expects FloorPlan format: { rooms: [...] }
      // If data has floorPlan property, use that, otherwise use the data as-is
      const floorPlanForBackend = actualPlanData?.floorPlan || actualPlanData;
      
      console.log('Sending to backend:', floorPlanForBackend);
      
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(floorPlanForBackend)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Analysis failed: ${response.status}`);
      }
      
      const analysisResults = await response.json();
      setResults(analysisResults);
      
      // Calculate metrics from the plan data
      const calculatedMetrics = calculateMetrics(actualPlanData);
      setMetrics(calculatedMetrics);
      
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback results
      setResults({
        issues: [],
        top_suggestions: [],
        ai_recommendations: "Unable to connect to recommendation service. Please ensure the backend is running.",
      });
    } finally {
      clearInterval(msgInterval);
      setTimeout(() => setStatus('analyzed'), 500);
    }
  }, [fileData, calculateMetrics]);

  // Auto-load floor plan from session/URL and run analysis
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
        console.log('Loaded floor plan from URL hash');
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
          console.log('Loaded floor plan from sessionStorage');
        }
      } catch (e) {
        console.warn('Invalid floor plan data in sessionStorage', e);
      }
    }

    if (incoming) {
      console.log('Floor plan data loaded:', incoming);
      setFileData(incoming);
      setFileName(incoming.fileName || 'Analyzed Floor Plan');
      
      // Auto-trigger analysis
      runAnalysis(incoming);
      
      // Clean up URL hash
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      console.warn('No floor plan data found');
    }
  }, [runAnalysis]);

  const downloadPDF = async () => {
    if (!results || isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const doc = new jsPDF();

      // Add logo if available
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
      
      // Add metrics section
      if (metrics) {
        doc.setFontSize(14).setTextColor(0).text("Overall Metrics", 14, currentY);
        currentY += 5;
        autoTable(doc, {
          startY: currentY,
          head: [['Metric', 'Value']],
          body: [
            ['Ventilation Score', `${metrics.overall.ventilation}/100`],
            ['Sunlight Score', `${metrics.overall.sunlight}/100`],
            ['Total Windows', metrics.overall.windowCount],
            ['Total Doors', metrics.overall.doorCount],
            ['Total Rooms', metrics.overall.roomCount],
          ],
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 5 },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (results.issues && results.issues.length > 0) {
        doc.setFontSize(14).setTextColor(0).text("Detected Issues & Recommended Improvements", 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Room', 'Issue', 'Severity', 'Recommendation']],
          body: results.issues.map(i => [i.room, i.problem, i.severity, i.reason]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 5 },
          columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 45 }, 2: { cellWidth: 25 }, 3: { cellWidth: 75 } },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (metrics && metrics.rooms.length > 0) {
        doc.setFontSize(14).setTextColor(0).text("Room-by-Room Analysis", 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Room', 'Area', 'Windows', 'Doors', 'Ventilation', 'Sunlight']],
          body: metrics.rooms.map(r => [r.name, r.area, r.windows, r.doors, r.ventilation, r.sunlight]),
          theme: 'striped',
          headStyles: { fillColor: [80, 80, 80], textColor: 255 },
          styles: { fontSize: 10, cellPadding: 5 },
        });
      }

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
        const plan = JSON.parse(event.target.result);
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
      // Extract actual data and floorPlan for backend
      const actualPlanData = fileData?.structured_document || fileData;
      const floorPlanForBackend = actualPlanData?.floorPlan || actualPlanData;
      
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: qText, 
          floor_plan: floorPlanForBackend, 
          issues: results?.issues || [] 
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ask endpoint error:', errorText);
        throw new Error('Q&A failed');
      }
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: CLEAN_MD(data.answer) }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to the service. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCanvasMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleCanvasMouseUp = () => setIsDragging(false);

  // Show upload screen if no data
  if (status === 'idle' && !fileData) {
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
            Upload JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
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

  // Get the base64 image from the detection result - check multiple possible locations
  console.log('FileData structure:', fileData);
  console.log('FileData keys:', fileData ? Object.keys(fileData) : 'no fileData');
  console.log('Actual data keys:', actualData ? Object.keys(actualData) : 'no actualData');
  
  const originalImageSrc = actualData?.input_image_b64 
    ? `data:image/png;base64,${actualData.input_image_b64}`
    : actualData?.image_b64
    ? `data:image/png;base64,${actualData.image_b64}`
    : actualData?.detectionResult?.image_b64
    ? `data:image/png;base64,${actualData.detectionResult.image_b64}`
    : actualData?.floorPlan?.image_b64
    ? `data:image/png;base64,${actualData.floorPlan.image_b64}`
    : fileData?.input_image_b64 
    ? `data:image/png;base64,${fileData.input_image_b64}`
    : null;
  
  console.log('Original image src:', originalImageSrc ? 'Image data found' : 'NO IMAGE DATA');

  // Helper to check if we have geometry data
  const hasGeometry = actualData?.geometryDetails?.walls && actualData?.geometryDetails?.doors !== undefined && actualData?.geometryDetails?.windows !== undefined;
  const canvasSize = actualData?.floorPlan?.canvasSize || actualData?.canvasSize || { width: 800, height: 600 };
  
  // Helper to convert polygon points to SVG path
  const polygonToPath = (polygon) => {
    if (!polygon || polygon.length === 0) return '';
    return polygon.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
  };

  return (
    <div className="app-container">

      {/* LEFT: Floor Plan Preview with Original Image */}
      <div className="panel left-panel">
        <div className="panel-header">
          <span className="panel-title">Floor Plan Preview</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={() => setShowDetections(!showDetections)}
              style={{
                padding: '6px 12px',
                background: showDetections ? 'var(--primary-color)' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background 0.2s'
              }}
              title={showDetections ? "Hide Detections" : "Show Detections"}
            >
              {showDetections ? <Eye size={14} /> : <EyeOff size={14} />}
              {showDetections ? 'Hide' : 'Show'}
            </button>
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
          ref={svgContainerRef}
          className="svg-container"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          style={{ touchAction: 'none', background: '#f5f5f5' }}
        >
          <div className="svg-content" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            {originalImageSrc ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  ref={imageRef}
                  src={originalImageSrc}
                  alt="Floor Plan"
                  style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                  onLoad={drawCanvas}
                  onError={(e) => {
                    console.error('Image load error:', e);
                    console.log('Attempted to load from:', originalImageSrc?.substring(0, 100));
                  }}
                />
                <canvas 
                  ref={canvasRef}
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    pointerEvents: 'none',
                    imageRendering: 'crisp-edges'
                  }}
                />
              </div>
            ) : (
              /* Fallback to SVG geometry if image not available */
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
                  <text x="50%" y="50%" textAnchor="middle" fill="#999">Loading floor plan...</text>
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Metrics Section */}
        {metrics && (
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'white' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Overall Metrics</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: '#f5f5f5', borderRadius: '6px', textAlign: 'center' }}>
                <Wind size={18} style={{ color: 'var(--primary-color)', marginBottom: '0.25rem' }} />
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Ventilation</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{metrics.overall.ventilation}/100</div>
              </div>
              <div style={{ padding: '0.5rem', background: '#f5f5f5', borderRadius: '6px', textAlign: 'center' }}>
                <Sun size={18} style={{ color: '#f59e0b', marginBottom: '0.25rem' }} />
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Sunlight</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{metrics.overall.sunlight}/100</div>
              </div>
              <div style={{ padding: '0.5rem', background: '#f5f5f5', borderRadius: '6px', textAlign: 'center' }}>
                <Maximize2 size={18} style={{ color: '#3b82f6', marginBottom: '0.25rem' }} />
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Windows</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{metrics.overall.windowCount}</div>
              </div>
              <div style={{ padding: '0.5rem', background: '#f5f5f5', borderRadius: '6px', textAlign: 'center' }}>
                <DoorOpen size={18} style={{ color: '#8b4513', marginBottom: '0.25rem' }} />
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Doors</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{metrics.overall.doorCount}</div>
              </div>
            </div>

            {/* Room-by-Room Table */}
            {metrics.rooms.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Room Analysis</div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Room</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Windows</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Ventilation</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Sunlight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.rooms.map((room, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{room.name}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>{room.windows}</td>
                          <td style={{ 
                            padding: '0.5rem', 
                            textAlign: 'center', 
                            borderBottom: '1px solid #eee',
                            color: room.ventilation === 'Good' ? '#10b981' : '#ef4444'
                          }}>
                            {room.ventilation}
                          </td>
                          <td style={{ 
                            padding: '0.5rem', 
                            textAlign: 'center', 
                            borderBottom: '1px solid #eee',
                            color: room.sunlight === 'Excellent' ? '#10b981' : room.sunlight === 'Good' ? '#f59e0b' : '#ef4444'
                          }}>
                            {room.sunlight}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
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
            <Download size={14} /> {isGeneratingPDF ? 'Generating PDF...' : 'Download Report'}
          </button>
        </div>

        <div className="center-content">
          <div>
            <div className="section-title">AI Design Review</div>
            <div className="brief-review" style={{ whiteSpace: 'pre-wrap' }}>
              {results?.ai_recommendations ? CLEAN_MD(results.ai_recommendations) : "Analyzing floor plan..."}
            </div>
          </div>

          {results?.top_suggestions && results.top_suggestions.length > 0 && (
            <div>
              <div className="section-title">Top Suggestions</div>
              <div className="suggestions-list">
                {results.top_suggestions.map((sug, idx) => (
                  <div key={idx} className="suggestion-item" style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.5rem', 
                    marginBottom: '0.8rem', 
                    padding: '0.8rem', 
                    backgroundColor: 'var(--panel-bg)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)' 
                  }}>
                    <AlertCircle size={18} className="suggestion-icon" style={{ marginTop: '2px', flexShrink: 0, color: 'var(--primary-color)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{sug.issue}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sug.improvement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results?.issues && results.issues.length > 0 && (
            <div>
              <div className="section-title">Detected Issues</div>
              <div className="timeline">
                {results.issues.map((iss, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-header">{iss.room}</div>
                    <div className="timeline-desc">{iss.problem}</div>
                    <div className="timeline-fix"><span>Fix: {iss.reason}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Virtual Architect Chat */}
      <div className="panel right-panel">
        <div className="panel-header" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem 1.5rem' }}>
          <span className="panel-title" style={{ fontSize: '1rem' }}>Virtual Architect</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Ask anything about this design</span>
        </div>

        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="message-content">{msg.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message ai">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="quick-questions" style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Quick Questions:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => askQuestion(q)}
                  disabled={isTyping}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    background: 'var(--panel-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    cursor: isTyping ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isTyping ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => !isTyping && (e.target.style.background = 'var(--primary-color)', e.target.style.color = 'white')}
                  onMouseLeave={(e) => (e.target.style.background = 'var(--panel-bg)', e.target.style.color = 'inherit')}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && askQuestion(chatInput)}
              placeholder="Ask about the floor plan..."
              disabled={isTyping}
              className="chat-input"
            />
            <button
              onClick={() => askQuestion(chatInput)}
              disabled={isTyping || !chatInput.trim()}
              className="chat-send-button"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
