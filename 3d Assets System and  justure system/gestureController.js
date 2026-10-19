import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

/**
 * 1€ Filter (One Euro Filter) for adaptive jitter reduction and zero-lag tracking.
 * - At low speed: High filtering to completely eliminate webcam landmark jitter.
 * - At high speed: Cutoff frequency dynamically rises so the cursor snaps instantly with zero lag.
 */
class OneEuroFilter {
    constructor(minCutoff = 1.2, beta = 0.008, dCutoff = 1.0) {
        this.minCutoff = minCutoff;
        this.beta = beta;
        this.dCutoff = dCutoff;
        this.xPrev = null;
        this.dxPrev = 0;
        this.tPrev = null;
    }

    alpha(cutoff, dt) {
        const tau = 1.0 / (2.0 * Math.PI * cutoff);
        return 1.0 / (1.0 + tau / dt);
    }

    filter(x, timestampMs) {
        if (this.xPrev === null || this.tPrev === null) {
            this.xPrev = x;
            this.tPrev = timestampMs;
            this.dxPrev = 0;
            return x;
        }

        const dt = Math.max((timestampMs - this.tPrev) / 1000.0, 0.001);
        this.tPrev = timestampMs;

        // Velocity (derivative) estimation
        const dx = (x - this.xPrev) / dt;
        const aD = this.alpha(this.dCutoff, dt);
        const edx = aD * dx + (1.0 - aD) * this.dxPrev;
        this.dxPrev = edx;

        // Dynamic cutoff based on velocity magnitude
        const cutoff = this.minCutoff + this.beta * Math.abs(edx);
        const a = this.alpha(cutoff, dt);
        const xFiltered = a * x + (1.0 - a) * this.xPrev;
        this.xPrev = xFiltered;

        return xFiltered;
    }

    reset() {
        this.xPrev = null;
        this.dxPrev = 0;
        this.tPrev = null;
    }
}

/**
 * High-Precision, Low-Latency Hand Gesture Controller
 * - 60 FPS hardware-synced detection via requestVideoFrameCallback
 * - Dual-hand tracking with distance-based spatial persistence (no hand swapping)
 * - Adaptive 1€ Filter for zero-lag and rock-steady precision
 * - Dual-threshold pinch hysteresis (enter: 0.33, release: 0.44)
 * - Active margin calibration for easy hotbar & corner reach
 * - Fist cooldown guard against accidental placement
 */
export class HandGestureController {
    constructor(options = {}) {
        this.options = Object.assign({
            videoWidth: 640,
            videoHeight: 480,
            pinchThreshold: 0.35,
            minDetectionConfidence: 0.65,
            minTrackingConfidence: 0.65
        }, options);

        this.isCameraRunning = false;
        this.isLandmarkerReady = false;

        // MediaPipe & DOM
        this.handLandmarker = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.animFrameId = null;
        this.videoCallbackId = null;
        this.lastVideoTime = -1;

        // Spatial Tracked Slots (Hand 0: Cyan, Hand 1: Green)
        this.trackedSlots = [
            {
                id: 0,
                active: false,
                x: 0.5,
                y: 0.5,
                screenX: window.innerWidth * 0.5,
                screenY: window.innerHeight * 0.5,
                isPinching: false,
                isFist: false,
                isOpen: false,
                lastSeen: 0,
                filterX: new OneEuroFilter(1.2, 0.008),
                filterY: new OneEuroFilter(1.2, 0.008),
                landmarks: null
            },
            {
                id: 1,
                active: false,
                x: 0.5,
                y: 0.5,
                screenX: window.innerWidth * 0.5,
                screenY: window.innerHeight * 0.5,
                isPinching: false,
                isFist: false,
                isOpen: false,
                lastSeen: 0,
                filterX: new OneEuroFilter(1.2, 0.008),
                filterY: new OneEuroFilter(1.2, 0.008),
                landmarks: null
            }
        ];

        this.hands = [];

        // Two-hand transform tracking
        this.isTwoHandPinching = false;
        this.twoHandStartDist = 0;
        this.twoHandStartAngle = 0;

        // Single-hand pinch tracking
        this.primaryPinching = false;
        this.pinchStartTime = 0;
        this.pinchStartPos = { x: 0.5, y: 0.5 };

        // Fist cooldown: prevent accidental actions right after a fist
        this.lastFistTime = 0;

        // Callbacks
        this.onPointerMove = null;       // ({ x, y }, ndc, hoveredElem)
        this.onPinchStart = null;        // (ndc, { pointer, screenPos, hoveredElem })
        this.onPinchMove = null;         // (ndc, { pointer, screenPos, delta })
        this.onPinchEnd = null;          // (ndc, { pointer, screenPos, hoveredElem })
        this.onTwoHandTransform = null;  // ({ scaleMultiplier, deltaAngle, dist, angle })
        this.onCancel = null;            // () -> Closed fist
        this.onError = null;

        this.initUI();
    }

    initUI() {
        this.cursor0 = document.getElementById('hand-cursor-0');
        this.cursor1 = document.getElementById('hand-cursor-1');

        this.video = document.getElementById('gesture-video');
        this.canvas = document.getElementById('gesture-canvas');

        // Dynamic fallback creation if not found in DOM
        if (!this.video || !this.canvas) {
            let pipContainer = document.getElementById('gesture-pip-container');
            if (!pipContainer) {
                pipContainer = document.createElement('div');
                pipContainer.id = 'gesture-pip-container';
                document.body.appendChild(pipContainer);
            }
            pipContainer.innerHTML = `
                <div class="pip-header">
                    <div class="pip-title-wrap">
                        <span class="pip-status-dot" id="pip-live-dot"></span>
                        <span class="pip-title">CAMERA & GESTURES (2 HANDS)</span>
                    </div>
                    <div class="pip-controls">
                        <button id="pip-toggle-btn" title="Toggle camera">📷</button>
                        <button id="pip-minimize-btn" title="Minimize preview">−</button>
                    </div>
                </div>
                <div class="pip-body" id="pip-body">
                    <video id="gesture-video" autoplay playsinline muted></video>
                    <canvas id="gesture-canvas"></canvas>
                    <div id="gesture-permission-overlay" style="display:none;">
                        <p>Allow camera access for hand tracking</p>
                        <button id="camera-grant-btn">📷 Allow Camera</button>
                    </div>
                    <div id="gesture-hud">
                        <div id="gesture-status-badge">Starting Camera...</div>
                        <div id="gesture-sub-status">Detecting Both Hands</div>
                        <button id="gesture-retry-btn" style="display:none; margin-top:5px; background:#00f7ff; color:#000000; border:none; padding:4px 12px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;">🔄 Retry Camera</button>
                    </div>
                </div>
                <div class="pip-footer-gestures">
                    <span class="gesture-hint" title="Open hand moves the cursor">🖐️ Open: Move Cursor</span>
                    <span class="gesture-hint" title="Pinch to select, drag or pull corners">🤏 Pinch: Drag / Resize</span>
                    <span class="gesture-hint" title="Two-hand pinch apart/together to scale, turn to rotate">🤏🤏 2 Hands: Scale & Rotate</span>
                    <span class="gesture-hint" title="Closed fist cancels current drag/placement">✊ Fist: Cancel</span>
                </div>
            `;
            this.video = document.getElementById('gesture-video');
            this.canvas = document.getElementById('gesture-canvas');
        }

        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.statusBadge = document.getElementById('gesture-status-badge');
        this.subStatus = document.getElementById('gesture-sub-status');
        this.pipBody = document.getElementById('pip-body');
        this.retryBtn = document.getElementById('gesture-retry-btn');
        this.grantBtn = document.getElementById('camera-grant-btn');
        this.permissionOverlay = document.getElementById('gesture-permission-overlay');
        this.liveDot = document.getElementById('pip-live-dot');

        if (this.retryBtn) {
            this.retryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.start();
            });
        }

        if (this.grantBtn) {
            this.grantBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.start();
            });
        }

        const minBtn = document.getElementById('pip-minimize-btn');
        if (minBtn && this.pipBody) {
            minBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = this.pipBody.style.display === 'none';
                this.pipBody.style.display = isHidden ? 'block' : 'none';
                minBtn.textContent = isHidden ? '−' : '+';
            });
        }

        const toggleBtn = document.getElementById('pip-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.isCameraRunning) {
                    this.stop();
                    this.updateStatus('Camera Paused', 'Click 📷 or Retry to resume', 'status-error');
                    if (this.retryBtn) this.retryBtn.style.display = 'inline-block';
                    toggleBtn.style.opacity = '0.5';
                    if (this.liveDot) this.liveDot.className = 'pip-status-dot paused';
                } else {
                    toggleBtn.style.opacity = '1.0';
                    this.start();
                }
            });
        }
    }

    updateStatus(badgeText, subText = '', stateClass = '') {
        if (this.statusBadge) {
            this.statusBadge.textContent = badgeText;
            if (stateClass) {
                this.statusBadge.className = stateClass;
            }
        }
        if (this.subStatus && subText !== '') {
            this.subStatus.textContent = subText;
        }
    }

    async initMediaPipe() {
        try {
            this.updateStatus('Loading AI Model...', 'Loading MediaPipe Hand Tracker');
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
            );

            const modelConfig = {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 2,
                minHandDetectionConfidence: this.options.minDetectionConfidence,
                minHandPresenceConfidence: this.options.minDetectionConfidence,
                minTrackingConfidence: this.options.minTrackingConfidence
            };

            try {
                this.handLandmarker = await HandLandmarker.createFromOptions(vision, modelConfig);
            } catch (gpuErr) {
                console.warn('GPU delegate fallback to CPU:', gpuErr);
                modelConfig.baseOptions.delegate = "CPU";
                this.handLandmarker = await HandLandmarker.createFromOptions(vision, modelConfig);
            }

            this.isLandmarkerReady = true;
            console.log('✅ MediaPipe HandLandmarker (2 Hands, GPU/High-Accuracy) ready');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize MediaPipe Hand Landmarker:', error);
            this.updateStatus('AI Load Error', 'Check camera/network permissions', 'status-error');
            if (this.retryBtn) this.retryBtn.style.display = 'inline-block';
            if (this.onError) this.onError(error);
            return false;
        }
    }

    async start() {
        if (this.isCameraRunning) return;

        if (this.video && this.video.srcObject) {
            try {
                this.video.srcObject.getTracks().forEach(t => t.stop());
                this.video.srcObject = null;
            } catch (e) {}
        }

        if (this.retryBtn) this.retryBtn.style.display = 'none';
        if (this.permissionOverlay) this.permissionOverlay.style.display = 'none';

        if (!this.isLandmarkerReady) {
            const ready = await this.initMediaPipe();
            if (!ready) return;
        }

        this.updateStatus('Requesting Camera...', 'Please allow webcam permission');

        let stream = null;
        try {
            // Request 60 FPS video for ultra-low latency & responsive tracking
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 60, min: 30 },
                    facingMode: 'user'
                },
                audio: false
            });
        } catch (firstErr) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            } catch (fallbackErr) {
                console.warn('⚠️ Camera access denied:', fallbackErr);
                this.updateStatus('Camera Blocked', 'Click Allow Camera button or address bar icon', 'status-error');
                if (this.permissionOverlay) this.permissionOverlay.style.display = 'flex';
                if (this.retryBtn) this.retryBtn.style.display = 'inline-block';
                if (this.liveDot) this.liveDot.className = 'pip-status-dot error';
                if (this.onError) this.onError(fallbackErr);
                return;
            }
        }

        if (!stream) {
            return;
        }

        if (!this.video || !document.body.contains(this.video)) {
            this.video = document.getElementById('gesture-video');
        }
        if (!this.canvas || !document.body.contains(this.canvas)) {
            this.canvas = document.getElementById('gesture-canvas');
        }

        if (!this.video || !this.canvas) {
            this.initUI();
            this.video = document.getElementById('gesture-video');
            this.canvas = document.getElementById('gesture-canvas');
        }

        if (!this.video) {
            console.error('Webcam video element not available');
            this.updateStatus('Video Element Error', 'Reload page', 'status-error');
            return;
        }

        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        try {
            this.video.srcObject = stream;
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play().then(resolve).catch(resolve);
                };
                setTimeout(resolve, 1500);
            });

            if (this.canvas) {
                this.canvas.width = this.video.videoWidth || 320;
                this.canvas.height = this.video.videoHeight || 240;
            }

            this.isCameraRunning = true;
            if (this.retryBtn) this.retryBtn.style.display = 'none';
            if (this.permissionOverlay) this.permissionOverlay.style.display = 'none';
            if (this.liveDot) this.liveDot.className = 'pip-status-dot live';

            this.updateStatus('Camera Active', 'Detecting hands...', 'status-hover');
            this.startDetectionLoop();
        } catch (err) {
            console.error('Error starting video stream:', err);
            this.updateStatus('Playback Error', err.message, 'status-error');
            if (this.retryBtn) this.retryBtn.style.display = 'inline-block';
            if (this.liveDot) this.liveDot.className = 'pip-status-dot error';
        }
    }

    stop() {
        this.isCameraRunning = false;

        if (this.videoCallbackId !== null && this.video && 'cancelVideoFrameCallback' in this.video) {
            try { this.video.cancelVideoFrameCallback(this.videoCallbackId); } catch (e) {}
            this.videoCallbackId = null;
        }

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }

        if (this.cursor0) this.cursor0.style.display = 'none';
        if (this.cursor1) this.cursor1.style.display = 'none';

        this.trackedSlots[0].active = false;
        this.trackedSlots[1].active = false;
        this.trackedSlots[0].filterX.reset();
        this.trackedSlots[0].filterY.reset();
        this.trackedSlots[1].filterX.reset();
        this.trackedSlots[1].filterY.reset();
        this.hands = [];
    }

    startDetectionLoop() {
        if (!this.isCameraRunning) return;

        const onFrame = (now) => {
            if (!this.isCameraRunning) return;
            this.detectCurrentFrame(now);

            // Synchronize with camera hardware frames using requestVideoFrameCallback if available
            if (this.video && 'requestVideoFrameCallback' in this.video) {
                this.videoCallbackId = this.video.requestVideoFrameCallback((time) => onFrame(time));
            } else {
                this.animFrameId = requestAnimationFrame(() => onFrame(performance.now()));
            }
        };

        if (this.video && 'requestVideoFrameCallback' in this.video) {
            this.videoCallbackId = this.video.requestVideoFrameCallback((time) => onFrame(time));
        } else {
            this.animFrameId = requestAnimationFrame(() => onFrame(performance.now()));
        }
    }

    detectCurrentFrame(timestamp) {
        if (!this.isCameraRunning || !this.video || !this.handLandmarker) return;
        if (this.video.readyState < 2) return;

        // Ensure strictly increasing timestamps for MediaPipe pipeline
        let timeMs = timestamp || performance.now();
        if (timeMs <= this.lastVideoTime) {
            timeMs = this.lastVideoTime + 1;
        }
        this.lastVideoTime = timeMs;

        try {
            const results = this.handLandmarker.detectForVideo(this.video, timeMs);
            this.processDetection(results, timeMs);
        } catch (e) {
            // Ignore temporary frame collision
        }
    }

    processDetection(results, now) {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const numDetected = results.landmarks ? results.landmarks.length : 0;

        if (numDetected === 0) {
            this.trackedSlots[0].active = false;
            this.trackedSlots[1].active = false;
            this.trackedSlots[0].filterX.reset();
            this.trackedSlots[0].filterY.reset();
            this.trackedSlots[1].filterX.reset();
            this.trackedSlots[1].filterY.reset();

            if (this.cursor0) this.cursor0.style.display = 'none';
            if (this.cursor1) this.cursor1.style.display = 'none';

            if (this.primaryPinching) {
                this.primaryPinching = false;
                if (this.onPinchEnd) {
                    this.onPinchEnd(
                        this.getNdcCoordinates({ x: this.trackedSlots[0].x, y: this.trackedSlots[0].y }),
                        { pointer: { x: this.trackedSlots[0].x, y: this.trackedSlots[0].y }, hoveredElem: null }
                    );
                }
            }
            if (this.isTwoHandPinching) {
                this.isTwoHandPinching = false;
            }

            this.updateStatus('✋ Show Hands', 'Keep 1 or 2 hands visible', 'status-idle');
            this.hands = [];
            return;
        }

        // =====================================================================
        // STEP 1: PARSE CANDIDATE HANDS & APPLY ACTIVE MARGIN CALIBRATION
        // =====================================================================
        const candidates = [];
        for (let i = 0; i < Math.min(numDetected, 2); i++) {
            const lm = results.landmarks[i];
            const wrist = lm[0];
            const middleMCP = lm[9];
            const palmSize = Math.hypot(wrist.x - middleMCP.x, wrist.y - middleMCP.y) || 0.2;

            const thumbTip = lm[4];
            const indexTip = lm[8];
            const rawPinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
            const normalizedPinchDist = rawPinchDist / palmSize;

            const isFist = this.checkClosedFist(lm, wrist);

            // Active margin calibration [0.06, 0.94]: allows reaching hotbar & edges comfortably
            const minM = 0.06;
            const maxM = 0.94;
            const calX = Math.max(0, Math.min(1, (indexTip.x - minM) / (maxM - minM)));
            const calY = Math.max(0, Math.min(1, (indexTip.y - minM) / (maxM - minM)));

            // Mirrored X for intuitive user mirror reflection
            const normX = 1.0 - calX;
            const normY = calY;

            // Screen pixel space coordinates
            const rawScreenX = normX * window.innerWidth;
            const rawScreenY = normY * window.innerHeight;

            candidates.push({
                landmarks: lm,
                palmSize: palmSize,
                normalizedPinchDist: normalizedPinchDist,
                isFist: isFist,
                rawScreenX: rawScreenX,
                rawScreenY: rawScreenY,
                normX: normX,
                normY: normY
            });
        }

        // =====================================================================
        // STEP 2: SPATIAL PERSISTENCE MATCHING (ELIMINATES HAND SWAPPING)
        // =====================================================================
        if (candidates.length === 1) {
            const cand = candidates[0];
            let targetSlotIdx = 0;

            if (!this.trackedSlots[0].active && this.trackedSlots[1].active) {
                targetSlotIdx = 1;
            } else if (this.trackedSlots[0].active && this.trackedSlots[1].active) {
                const d0 = Math.hypot(cand.rawScreenX - this.trackedSlots[0].screenX, cand.rawScreenY - this.trackedSlots[0].screenY);
                const d1 = Math.hypot(cand.rawScreenX - this.trackedSlots[1].screenX, cand.rawScreenY - this.trackedSlots[1].screenY);
                targetSlotIdx = d0 <= d1 ? 0 : 1;
            }

            const otherSlotIdx = targetSlotIdx === 0 ? 1 : 0;
            // Graceful persistence: deactivate other slot only after 120ms
            if (now - this.trackedSlots[otherSlotIdx].lastSeen > 120) {
                this.trackedSlots[otherSlotIdx].active = false;
                this.trackedSlots[otherSlotIdx].filterX.reset();
                this.trackedSlots[otherSlotIdx].filterY.reset();
            }

            this.updateTrackedSlot(this.trackedSlots[targetSlotIdx], cand, now);
        } else if (candidates.length >= 2) {
            const cand0 = candidates[0];
            const cand1 = candidates[1];

            // Evaluate Euclidean distance for both permutations
            const d00 = Math.hypot(cand0.rawScreenX - this.trackedSlots[0].screenX, cand0.rawScreenY - this.trackedSlots[0].screenY);
            const d11 = Math.hypot(cand1.rawScreenX - this.trackedSlots[1].screenX, cand1.rawScreenY - this.trackedSlots[1].screenY);

            const d01 = Math.hypot(cand0.rawScreenX - this.trackedSlots[1].screenX, cand0.rawScreenY - this.trackedSlots[1].screenY);
            const d10 = Math.hypot(cand1.rawScreenX - this.trackedSlots[0].screenX, cand1.rawScreenY - this.trackedSlots[0].screenY);

            if (this.trackedSlots[0].active && this.trackedSlots[1].active && (d01 + d10 < d00 + d11)) {
                this.updateTrackedSlot(this.trackedSlots[1], cand0, now);
                this.updateTrackedSlot(this.trackedSlots[0], cand1, now);
            } else {
                this.updateTrackedSlot(this.trackedSlots[0], cand0, now);
                this.updateTrackedSlot(this.trackedSlots[1], cand1, now);
            }
        }

        // =====================================================================
        // STEP 3: UPDATE VISUAL CURSORS (GPU COMPOSITOR WITHOUT REFLOW)
        // =====================================================================
        const s0 = this.trackedSlots[0];
        if (s0.active && this.cursor0) {
            this.cursor0.style.display = 'block';
            this.cursor0.style.transform = `translate3d(${s0.screenX}px, ${s0.screenY}px, 0) translate(-50%, -50%)`;
            if (s0.isPinching) {
                this.cursor0.classList.add('pinching');
            } else {
                this.cursor0.classList.remove('pinching');
            }
            this.drawHandSkeleton(s0.landmarks, '#00f7ff', s0.isPinching);
        } else if (this.cursor0) {
            this.cursor0.style.display = 'none';
        }

        const s1 = this.trackedSlots[1];
        if (s1.active && this.cursor1) {
            this.cursor1.style.display = 'block';
            this.cursor1.style.transform = `translate3d(${s1.screenX}px, ${s1.screenY}px, 0) translate(-50%, -50%)`;
            if (s1.isPinching) {
                this.cursor1.classList.add('pinching');
            } else {
                this.cursor1.classList.remove('pinching');
            }
            this.drawHandSkeleton(s1.landmarks, '#00ff88', s1.isPinching);
        } else if (this.cursor1) {
            this.cursor1.style.display = 'none';
        }

        // Export active hands list
        const activeHands = [];
        if (s0.active) activeHands.push(s0);
        if (s1.active) activeHands.push(s1);
        this.hands = activeHands;

        // =====================================================================
        // STEP 4: GESTURE 1: CLOSED FIST -> CANCEL (WITH COOLDOWN)
        // =====================================================================
        const hasFist = activeHands.some(h => h.isFist);
        if (hasFist) {
            this.lastFistTime = now;
            this.primaryPinching = false;
            this.isTwoHandPinching = false;
            this.updateStatus('✊ Closed Fist: Cancel', 'Drag / placement canceled', 'status-error');
            if (this.onCancel) this.onCancel();
            return;
        }

        // Fist cooldown: prevent accidental actions right after fist release
        if (now - this.lastFistTime < 550) {
            this.primaryPinching = false;
            this.updateStatus('✋ Fist Released', 'Ready for next action', 'status-hover');
            return;
        }

        // =====================================================================
        // STEP 5: GESTURE 2: TWO-HAND PINCH -> SCALE & ROTATE
        // =====================================================================
        const twoHandPinch = (s0.active && s1.active && s0.isPinching && s1.isPinching);
        if (twoHandPinch) {
            const p0 = { x: s0.x, y: s0.y };
            const p1 = { x: s1.x, y: s1.y };

            const currentDist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
            const currentAngle = Math.atan2(p1.y - p0.y, p1.x - p0.x);

            this.drawTwoHandLine(s0, s1);

            if (!this.isTwoHandPinching) {
                this.isTwoHandPinching = true;
                this.twoHandStartDist = Math.max(currentDist, 0.05);
                this.twoHandStartAngle = currentAngle;
                this.updateStatus('📐 Two-Hand Transform', 'Apart/together: Scale | Turn: Rotate', 'status-grab');
            } else {
                const scaleMultiplier = currentDist / this.twoHandStartDist;
                const deltaAngle = currentAngle - this.twoHandStartAngle;

                this.updateStatus(
                    `📐 Scale: ${(scaleMultiplier).toFixed(2)}x`,
                    `Rotate: ${(deltaAngle * 180 / Math.PI).toFixed(0)}°`,
                    'status-grab'
                );

                if (this.onTwoHandTransform) {
                    this.onTwoHandTransform({
                        scaleMultiplier: scaleMultiplier,
                        deltaAngle: deltaAngle,
                        dist: currentDist,
                        angle: currentAngle
                    });
                }
            }
            return;
        } else {
            this.isTwoHandPinching = false;
        }

        // =====================================================================
        // STEP 6: GESTURE 3 & 4: PRIMARY HAND PINCH DRAG & OPEN HAND MOVE
        // =====================================================================
        const primary = s0.active ? s0 : s1;
        if (!primary) return;

        const screenX = primary.screenX;
        const screenY = primary.screenY;
        const ndc = this.getNdcCoordinates({ x: primary.x, y: primary.y });
        const hoveredElem = document.elementFromPoint(screenX, screenY);

        if (primary.isPinching) {
            if (!this.primaryPinching) {
                // Pinch Start
                this.primaryPinching = true;
                this.pinchStartTime = now;
                this.pinchStartPos = { x: primary.x, y: primary.y };

                this.updateStatus('🤏 Pinch: Dragging', 'Hold and move to position', 'status-grab');

                if (this.onPinchStart) {
                    this.onPinchStart(ndc, {
                        pointer: { x: primary.x, y: primary.y },
                        screenPos: { x: screenX, y: screenY },
                        hoveredElem: hoveredElem
                    });
                }
            } else {
                // Pinch Move
                const dx = primary.x - this.pinchStartPos.x;
                const dy = primary.y - this.pinchStartPos.y;

                if (this.onPinchMove) {
                    this.onPinchMove(ndc, {
                        pointer: { x: primary.x, y: primary.y },
                        screenPos: { x: screenX, y: screenY },
                        delta: { x: dx, y: dy }
                    });
                }
            }
        } else {
            if (this.primaryPinching) {
                // Explicit Release -> Drop / Place
                this.primaryPinching = false;
                this.updateStatus('✋ Released: Dropped', 'Placed furniture at floor position', 'status-confirm');

                if (this.onPinchEnd) {
                    this.onPinchEnd(ndc, {
                        pointer: { x: primary.x, y: primary.y },
                        screenPos: { x: screenX, y: screenY },
                        hoveredElem: hoveredElem
                    });
                }
            } else {
                // Open Hand: Move Cursor
                this.updateStatus(
                    activeHands.length === 2 ? '🖐️🖐️ 2 Hands Active' : '🖐️ Open Hand: Move Cursor',
                    'Pinch hotbar to select & drag, or pinch object to move',
                    'status-hover'
                );

                if (this.onPointerMove) {
                    this.onPointerMove({ x: primary.x, y: primary.y }, ndc, hoveredElem);
                }
            }
        }
    }

    updateTrackedSlot(slot, cand, now) {
        slot.active = true;
        slot.lastSeen = now;
        slot.landmarks = cand.landmarks;
        slot.palmSize = cand.palmSize;
        slot.isFist = cand.isFist;

        // Dual-Threshold Pinch Hysteresis:
        // Enter pinch at < 0.33, release pinch at > 0.44
        const pinchEnter = 0.33;
        const pinchRelease = 0.44;
        slot.isPinching = slot.isPinching
            ? (cand.normalizedPinchDist < pinchRelease)
            : (cand.normalizedPinchDist < pinchEnter);

        slot.isOpen = !slot.isPinching && !slot.isFist && this.checkOpenHand(cand.landmarks, cand.landmarks[0]);

        // Adaptive 1€ Filter in pixel space:
        // Low velocity: minCutoff = 1.2Hz -> zero jitter
        // High velocity: cutoff scales with speed -> zero lag
        const filteredScreenX = slot.filterX.filter(cand.rawScreenX, now);
        const filteredScreenY = slot.filterY.filter(cand.rawScreenY, now);

        slot.screenX = filteredScreenX;
        slot.screenY = filteredScreenY;
        slot.x = Math.max(0, Math.min(1, filteredScreenX / window.innerWidth));
        slot.y = Math.max(0, Math.min(1, filteredScreenY / window.innerHeight));
        slot.pointer = { x: slot.x, y: slot.y };
    }

    getNdcCoordinates(pointer) {
        return {
            x: (pointer.x * 2.0) - 1.0,
            y: -((pointer.y * 2.0) - 1.0)
        };
    }

    checkOpenHand(lm, wrist) {
        const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        const indexUp = dist(lm[8], wrist) > dist(lm[6], wrist) * 1.15;
        const middleUp = dist(lm[12], wrist) > dist(lm[10], wrist) * 1.15;
        const ringUp = dist(lm[16], wrist) > dist(lm[14], wrist) * 1.15;
        const pinkyUp = dist(lm[20], wrist) > dist(lm[18], wrist) * 1.15;
        return (indexUp && middleUp && ringUp && pinkyUp);
    }

    checkClosedFist(lm, wrist) {
        const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        // Fingertips closer to wrist than PIP joints (rotation invariant)
        const indexCurled = dist(lm[8], wrist) < dist(lm[6], wrist) * 1.05;
        const middleCurled = dist(lm[12], wrist) < dist(lm[10], wrist) * 1.05;
        const ringCurled = dist(lm[16], wrist) < dist(lm[14], wrist) * 1.05;
        const pinkyCurled = dist(lm[20], wrist) < dist(lm[18], wrist) * 1.05;
        const thumbCurled = dist(lm[4], lm[9]) < dist(lm[2], lm[9]) * 1.3 || dist(lm[4], wrist) < dist(lm[3], wrist) * 1.1;
        return indexCurled && middleCurled && ringCurled && pinkyCurled && thumbCurled;
    }

    drawHandSkeleton(landmarks, strokeColor, isPinching) {
        if (!landmarks || !this.ctx || !this.canvas) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        const CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [17, 18], [18, 19], [19, 20],
            [0, 17]
        ];

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;

        CONNECTIONS.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            ctx.beginPath();
            ctx.moveTo((1 - p1.x) * w, p1.y * h);
            ctx.lineTo((1 - p2.x) * w, p2.y * h);
            ctx.stroke();
        });

        landmarks.forEach((p, idx) => {
            const isPinchFinger = (idx === 4 || idx === 8);
            ctx.fillStyle = isPinchFinger ? (isPinching ? '#00ff88' : '#ffff00') : '#ffffff';
            ctx.beginPath();
            ctx.arc((1 - p.x) * w, p.y * h, isPinchFinger ? 4.5 : 2.5, 0, 2 * Math.PI);
            ctx.fill();
        });

        const t = landmarks[4];
        const idx = landmarks[8];
        ctx.strokeStyle = isPinching ? '#00ff88' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = isPinching ? 3.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo((1 - t.x) * w, t.y * h);
        ctx.lineTo((1 - idx.x) * w, idx.y * h);
        ctx.stroke();
    }

    drawTwoHandLine(h0, h1) {
        if (!this.ctx || !this.canvas) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        const x0 = h0.x * w;
        const y0 = h0.y * h;
        const x1 = h1.x * w;
        const y1 = h1.y * h;

        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.setLineDash([]);

        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(mx, my, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}
