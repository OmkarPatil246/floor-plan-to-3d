// =============================================================================
// COMPLETE GESTURE DETECTION & ASSET PLACEMENT SYSTEM
// Exact implementation from 3D Assets System project
// =============================================================================

// Global state
let gestureSystem = null;
let selectedAsset = null;
const MAX_REACH_DIST = 8.0;

class GestureDetectionSystem {
  constructor() {
    // MediaPipe elements
    this.video = document.getElementById('gesture-camera-video');
    this.canvas = document.getElementById('gesture-canvas-overlay');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.statusEl = document.getElementById('gesture-status');
    
    this.isActive = false;
    this.hands = null;
    this.mediaPipeCamera = null;
    
    // Hand tracking
    this.leftHand = null;
    this.rightHand = null;
    this.prevLeftHand = null;
    this.prevRightHand = null;
    
    // State Machine - Explicit Drag & Drop (from reference project)
    this.isDraggingFromAssetPanel = false;  // Dragging ghost from asset list
    this.isDraggingExisting = false;        // Moving existing placed object
    this.isResizingCorner = false;          // Pulling corner handle
    this.isTwoHandTransform = false;        // Two-hand scale/rotate
    
    this.selectedAssetIndex = -1;
    this.draggedObject = null;              // Actual placed object being manipulated
    this.ghostPreview = null;               // Preview showing where object will be placed
    
    // Two-hand transform baselines
    this.twoHandBaseScale = 1.0;
    this.twoHandBaseRotation = 0;
    this.twoHandStartDist = 0;
    this.twoHandStartAngle = 0;
    
    // Raycasting to floor
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.floorIntersection = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    
    // Pinch detection with dual-threshold hysteresis
    this.PINCH_ENTER_THRESHOLD = 0.04;
    this.PINCH_RELEASE_THRESHOLD = 0.06;
    this.HISTORY_SIZE = 3;
    this.leftPinchHistory = [];
    this.rightPinchHistory = [];
    this.leftPinching = false;
    this.rightPinching = false;
    
    // Fist detection cooldown
    this.lastFistTime = 0;
    this.FIST_COOLDOWN_MS = 550;
    
    // Drag offset for moving existing objects
    this.dragOffset = new THREE.Vector3();
    
    this.initMediaPipe();
  }
  
  async initMediaPipe() {
    try {
      console.log('🎥 Initializing MediaPipe Hands...');
      
      // Wait for MediaPipe to load
      if (!window.Hands) {
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (window.Hands) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
      }
      
      this.hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      
      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
        selfieMode: true
      });
      
      this.hands.onResults((results) => this.onHandsDetected(results));
      
      console.log('✅ MediaPipe Hands initialized');
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe:', error);
    }
  }
  
  async startCamera() {
    if (this.isActive) return;
    
    try {
      console.log('📹 Starting camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      
      this.video.srcObject = stream;
      this.isActive = true;
      
      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          if (this.canvas) {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
          }
          resolve();
        };
      });
      
      // Wait for Camera utility
      if (!window.Camera) {
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (window.Camera) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
      }
      
      this.mediaPipeCamera = new Camera(this.video, {
        onFrame: async () => {
          if (this.hands && this.isActive) {
            await this.hands.send({image: this.video});
          }
        },
        width: 1280,
        height: 720
      });
      
      this.mediaPipeCamera.start();
      console.log('✅ Camera started successfully');
      
      if (this.statusEl) {
        this.statusEl.textContent = '✋ Show hands to begin';
        this.statusEl.className = 'idle';
      }
      
    } catch (error) {
      console.error('❌ Camera access denied:', error);
      if (this.statusEl) {
        this.statusEl.textContent = 'Camera access denied';
        this.statusEl.className = 'error';
      }
    }
  }
  
  stopCamera() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.mediaPipeCamera) {
      this.mediaPipeCamera.stop();
    }
    
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
      this.video.srcObject = null;
    }
    
    this.leftHand = null;
    this.rightHand = null;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    console.log('🛑 Camera stopped');
  }
  
  onHandsDetected(results) {
    if (!this.isActive || !this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update hand data
    this.prevLeftHand = this.leftHand;
    this.prevRightHand = this.rightHand;
    this.leftHand = null;
    this.rightHand = null;
    
    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i].label;
        
        this.drawHand(landmarks, handedness);
        
        const handData = { landmarks, label: handedness };
        
        if (handedness === 'Left') {
          this.leftHand = handData;
        } else {
          this.rightHand = handData;
        }
      }
    }
    
    this.processGestures();
  }
  
  drawHand(landmarks, handedness) {
    const color = handedness === 'Left' ? '#00ff00' : '#ff00ff';
    
    // Draw connections
    const connections = [
      [0,1],[1,2],[2,3],[3,4],  // Thumb
      [0,5],[5,6],[6,7],[7,8],  // Index
      [0,9],[9,10],[10,11],[11,12],  // Middle
      [0,13],[13,14],[14,15],[15,16],  // Ring
      [0,17],[17,18],[18,19],[19,20],  // Pinky
      [5,9],[9,13],[13,17]  // Palm
    ];
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      this.ctx.beginPath();
      this.ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
      this.ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);
      this.ctx.stroke();
    });
    
    // Draw landmarks
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * this.canvas.width;
      const y = landmark.y * this.canvas.height;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, index === 4 || index === 8 ? 6 : 4, 0, 2 * Math.PI);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    });
  }
  
  isPinching(hand) {
    if (!hand) return false;
    
    const thumb = hand.landmarks[4];
    const index = hand.landmarks[8];
    
    const dx = thumb.x - index.x;
    const dy = thumb.y - index.y;
    const dz = (thumb.z || 0) - (index.z || 0);
    
    return Math.sqrt(dx*dx + dy*dy + dz*dz) < this.PINCH_ENTER_THRESHOLD;
  }
  
  smoothPinch(hand, history, currentState) {
    const isPinch = this.isPinching(hand);
    history.push(isPinch ? 1 : 0);
    
    if (history.length > this.HISTORY_SIZE) {
      history.shift();
    }
    
    const sum = history.reduce((a, b) => a + b, 0);
    const shouldBePinching = sum >= Math.ceil(this.HISTORY_SIZE / 2);
    
    // Dual-threshold hysteresis
    if (currentState) {
      // Currently pinching - need consistent release to stop
      return shouldBePinching || history[history.length - 1] === 1;
    } else {
      // Not pinching - need consistent pinch to start
      return shouldBePinching;
    }
  }
  
  checkClosedFist(hand) {
    if (!hand) return false;
    
    const landmarks = hand.landmarks;
    const wrist = landmarks[0];
    
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    
    // All fingertips closer to wrist than their PIP joints
    const indexCurled = dist(landmarks[8], wrist) < dist(landmarks[6], wrist) * 1.05;
    const middleCurled = dist(landmarks[12], wrist) < dist(landmarks[10], wrist) * 1.05;
    const ringCurled = dist(landmarks[16], wrist) < dist(landmarks[14], wrist) * 1.05;
    const pinkyCurled = dist(landmarks[20], wrist) < dist(landmarks[18], wrist) * 1.05;
    const thumbCurled = dist(landmarks[4], landmarks[9]) < dist(landmarks[2], landmarks[9]) * 1.3;
    
    return indexCurled && middleCurled && ringCurled && pinkyCurled && thumbCurled;
  }
  
  processGestures() {
    const now = performance.now();
    
    // Update pinch states with smoothing
    this.leftPinching = this.leftHand ? 
      this.smoothPinch(this.leftHand, this.leftPinchHistory, this.leftPinching) : false;
    this.rightPinching = this.rightHand ? 
      this.smoothPinch(this.rightHand, this.rightPinchHistory, this.rightPinching) : false;
    
    // Check for closed fist - CANCEL gesture
    const hasFist = (this.leftHand && this.checkClosedFist(this.leftHand)) ||
                    (this.rightHand && this.checkClosedFist(this.rightHand));
    
    if (hasFist) {
      this.handleGestureCancel();
      this.lastFistTime = now;
      return;
    }
    
    // Fist cooldown - prevent accidental actions after fist
    if (now - this.lastFistTime < this.FIST_COOLDOWN_MS) {
      if (this.statusEl) {
        this.statusEl.textContent = '✋ Fist Released - Ready';
        this.statusEl.className = 'idle';
      }
      return;
    }
    
    // Get primary hand for single-hand gestures
    const primaryHand = this.leftHand || this.rightHand;
    const primaryPinching = this.leftPinching || this.rightPinching;
    
    // GESTURE 1: TWO-HAND PINCH -> Scale & Rotate
    if (this.leftPinching && this.rightPinching && this.leftHand && this.rightHand) {
      this.handleTwoHandTransform();
      return;
    } else {
      this.isTwoHandTransform = false;
    }
    
    // GESTURE 2: SINGLE-HAND PINCH -> Drag/Drop
    if (primaryPinching && primaryHand) {
      this.handlePinchGesture(primaryHand);
    } else if (!primaryPinching) {
      this.handlePinchRelease(primaryHand);
    }
    
    // GESTURE 3: OPEN HAND -> Pointer/Hover
    if (!primaryPinching && primaryHand) {
      this.handlePointerMove(primaryHand);
    }
  }
  
  handlePointerMove(hand) {
    const indexTip = hand.landmarks[8];
    
    // Convert to NDC coordinates
    const ndcX = (indexTip.x * 2) - 1;
    const ndcY = -((indexTip.y * 2) - 1);
    
    // Raycast to floor
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    
    if (this.raycaster.ray.intersectPlane(this.floorPlane, this.floorIntersection)) {
      const dist = camera.position.distanceTo(this.floorIntersection);
      
      if (dist <= MAX_REACH_DIST) {
        // Update ghost preview if dragging from asset panel
        if (this.isDraggingFromAssetPanel && this.ghostPreview) {
          const config = assetConfig[selectedAsset];
          this.ghostPreview.position.set(
            this.floorIntersection.x,
            config.yOffset + 0.25,
            this.floorIntersection.z
          );
          this.ghostPreview.visible = true;
          
          if (this.statusEl) {
            this.statusEl.textContent = '🤏 Release pinch to place';
            this.statusEl.className = 'placing';
          }
        }
        return;
      }
    }
    
    // Not pointing at valid floor location
    if (this.ghostPreview) {
      this.ghostPreview.visible = false;
    }
    
    if (this.statusEl && !this.isDraggingFromAssetPanel) {
      this.statusEl.textContent = '✋ Open Hand - Move cursor';
      this.statusEl.className = 'idle';
    }
  }
  
  handlePinchGesture(hand) {
    const indexTip = hand.landmarks[8];
    
    // Check if pinching asset panel item
    const screenX = indexTip.x * window.innerWidth;
    const screenY = indexTip.y * window.innerHeight;
    
    // Start dragging from asset panel
    if (!this.isDraggingFromAssetPanel && !this.draggedObject && this.selectedAssetIndex >= 0) {
      this.isDraggingFromAssetPanel = true;
      
      // Create ghost preview
      if (!this.ghostPreview) {
        const ghostGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const ghostMat = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.4,
          wireframe: true
        });
        this.ghostPreview = new THREE.Mesh(ghostGeo, ghostMat);
        this.ghostPreview.name = 'ghostPreview';
        scene.add(this.ghostPreview);
      }
      this.ghostPreview.visible = true;
      
      if (this.statusEl) {
        this.statusEl.textContent = '🤏 Dragging - Release to place';
        this.statusEl.className = 'placing';
      }
    }
  }
  
  async handlePinchRelease(hand) {
    // Release: Place object from asset panel
    if (this.isDraggingFromAssetPanel && selectedAsset) {
      this.isDraggingFromAssetPanel = false;
      
      if (this.ghostPreview) {
        this.ghostPreview.visible = false;
      }
      
      // Raycast to floor
      if (hand) {
        const indexTip = hand.landmarks[8];
        const ndcX = (indexTip.x * 2) - 1;
        const ndcY = -((indexTip.y * 2) - 1);
        
        this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
        
        if (this.raycaster.ray.intersectPlane(this.floorPlane, this.floorIntersection)) {
          const dist = camera.position.distanceTo(this.floorIntersection);
          
          if (dist <= MAX_REACH_DIST) {
            // Place object
            try {
              const model = await loadAssetModel(selectedAsset);
              const config = assetConfig[selectedAsset];
              
              model.position.set(
                this.floorIntersection.x,
                config.yOffset,
                this.floorIntersection.z
              );
              model.userData.isPlacedAsset = true;
              model.userData.assetId = selectedAsset;
              
              planGroup.add(model);
              placedAssets.push(model);
              
              console.log(`✅ Placed ${selectedAsset} on floor`);
              
              if (this.statusEl) {
                this.statusEl.textContent = '✅ Object placed!';
                this.statusEl.className = 'success';
              }
              
              savePlacedAssets();
              
              // Reset selection
              this.selectedAssetIndex = -1;
              selectedAsset = null;
            } catch (error) {
              console.error('❌ Failed to place asset:', error);
              if (this.statusEl) {
                this.statusEl.textContent = '❌ Placement failed';
                this.statusEl.className = 'error';
              }
            }
          } else {
            if (this.statusEl) {
              this.statusEl.textContent = '⚠️ Too far - move closer';
              this.statusEl.className = 'error';
            }
          }
        }
      }
    }
  }
  
  handleTwoHandTransform() {
    if (!this.leftHand || !this.rightHand) return;
    
    const leftIndex = this.leftHand.landmarks[8];
    const rightIndex = this.rightHand.landmarks[8];
    
    const currentDist = Math.hypot(
      rightIndex.x - leftIndex.x,
      rightIndex.y - leftIndex.y
    );
    const currentAngle = Math.atan2(
      rightIndex.y - leftIndex.y,
      rightIndex.x - leftIndex.x
    );
    
    if (!this.isTwoHandTransform) {
      this.isTwoHandTransform = true;
      this.twoHandStartDist = Math.max(currentDist, 0.05);
      this.twoHandStartAngle = currentAngle;
      
      if (this.statusEl) {
        this.statusEl.textContent = '📐 Two hands - Scale & Rotate';
        this.statusEl.className = 'scaling';
      }
    } else {
      const scaleMultiplier = currentDist / this.twoHandStartDist;
      const deltaAngle = currentAngle - this.twoHandStartAngle;
      
      // Apply to most recent placed object if any
      if (placedAssets.length > 0 && !this.draggedObject) {
        this.draggedObject = placedAssets[placedAssets.length - 1];
        this.twoHandBaseScale = this.draggedObject.scale.x;
        this.twoHandBaseRotation = this.draggedObject.rotation.y;
      }
      
      if (this.draggedObject) {
        let newScale = this.twoHandBaseScale * scaleMultiplier;
        newScale = THREE.MathUtils.clamp(newScale, 0.2, 3.0);
        
        this.draggedObject.scale.set(newScale, newScale, newScale);
        this.draggedObject.rotation.y = this.twoHandBaseRotation + deltaAngle;
        
        if (this.statusEl) {
          this.statusEl.textContent = `📐 Scale: ${newScale.toFixed(2)}x | Rotate: ${(deltaAngle * 180 / Math.PI).toFixed(0)}°`;
          this.statusEl.className = 'scaling';
        }
      }
    }
  }
  
  handleGestureCancel() {
    if (this.isDraggingFromAssetPanel) {
      this.isDraggingFromAssetPanel = false;
      if (this.ghostPreview) {
        this.ghostPreview.visible = false;
      }
      if (this.statusEl) {
        this.statusEl.textContent = '✊ Placement canceled';
        this.statusEl.className = 'error';
      }
    }
    
    if (this.isTwoHandTransform) {
      this.isTwoHandTransform = false;
      this.draggedObject = null;
    }
  }
  
  selectAssetFromPanel(assetIndex) {
    this.selectedAssetIndex = assetIndex;
    
    const panelItems = document.querySelectorAll('.asset-item');
    panelItems.forEach((item, i) => {
      item.classList.toggle('selected', i === assetIndex);
    });
    
    const assetKeys = Object.keys(assetConfig);
    if (assetIndex >= 0 && assetIndex < assetKeys.length) {
      selectedAsset = assetKeys[assetIndex];
      console.log('✅ Asset selected:', selectedAsset);
      
      if (this.statusEl) {
        this.statusEl.textContent = `Selected: ${selectedAsset}`;
        this.statusEl.className = 'selecting';
      }
    }
  }
}

// Export for use in main HTML
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GestureDetectionSystem };
}
