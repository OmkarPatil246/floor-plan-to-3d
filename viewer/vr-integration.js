/**
 * VR Integration Module for Floor Plan Viewer
 * Enables VR sharing via ngrok tunnel
 */

export class VRIntegration {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.ws = null;
    this.peerConnection = null;
    this.dataChannel = null;
    this.sessionId = null;
    this.isStreaming = false;
    this.isConnected = false;
    this.ngrokUrl = null;
    
    // Frame streaming settings
    this.frameInterval = 1000 / 30; // 30 FPS
    this.lastFrameTime = 0;
    this.quality = 0.7;
    
    // Head movement tracking from mobile
    this.mobileRotation = { x: 0, y: 0, z: 0 };
  }
  
  /**
   * Initialize VR mode
   */
  async startVRMode() {
    // Generate unique session ID
    this.sessionId = Math.random().toString(36).substring(2, 10);
    
    // Connect to signaling server
    await this.connectWebSocket();
    
    // Get ngrok URL
    await this.fetchNgrokUrl();
    
    // Show QR code modal
    this.showQRCodeModal();
    
    return this.sessionId;
  }
  
  /**
   * Connect to WebSocket signaling server
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      const WS_URL = window.location.protocol === 'https:' 
        ? `wss://${window.location.host}` 
        : `ws://${window.location.host}`;
      
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to VR signaling server');
        this.ws.send(JSON.stringify({ 
          type: 'register', 
          role: 'primary', 
          sessionId: this.sessionId 
        }));
        resolve();
      };
      
      this.ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        await this.handleSignalingMessage(data);
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        this.isConnected = false;
      };
    });
  }
  
  /**
   * Handle signaling messages
   */
  async handleSignalingMessage(data) {
    switch (data.type) {
      case 'registered':
        console.log('✅ Registered as primary device');
        break;
        
      case 'secondary-connected':
        console.log('✅ Mobile device connected!');
        this.isConnected = true;
        await this.setupPeerConnection();
        this.updateModalStatus('connected');
        break;
        
      case 'answer':
        await this.handleAnswer(data.answer);
        break;
        
      case 'ice-candidate':
        if (this.peerConnection) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
        break;
        
      case 'head-movement':
        this.updateCameraFromMobile(data.rotation);
        break;
        
      case 'secondary-disconnected':
        console.log('📱 Mobile device disconnected');
        this.updateModalStatus('disconnected');
        break;
        
      case 'ngrok-url':
        this.ngrokUrl = data.url;
        break;
    }
  }
  
  /**
   * Fetch ngrok URL from server
   */
  async fetchNgrokUrl() {
    try {
      const response = await fetch('/api/ngrok-url');
      if (response.ok) {
        const data = await response.json();
        this.ngrokUrl = data.url;
        console.log('✅ Ngrok URL:', this.ngrokUrl);
      }
    } catch (error) {
      console.warn('⚠️  Ngrok not available, using local URL');
      this.ngrokUrl = null;
    }
  }
  
  /**
   * Setup WebRTC peer connection
   */
  async setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    // Create data channel for frame streaming
    this.dataChannel = this.peerConnection.createDataChannel('frames', {
      ordered: false,
      maxRetransmits: 0
    });
    
    this.dataChannel.onopen = () => {
      console.log('✅ Data channel opened');
      this.isStreaming = true;
      this.startFrameStreaming();
    };
    
    this.dataChannel.onerror = (error) => {
      console.error('❌ Data channel error:', error);
    };
    
    this.dataChannel.onclose = () => {
      console.log('🔌 Data channel closed');
      this.isStreaming = false;
    };
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.ws.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          sessionId: this.sessionId
        }));
      }
    };
    
    // Create and send offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    this.ws.send(JSON.stringify({
      type: 'offer',
      offer: offer,
      sessionId: this.sessionId
    }));
  }
  
  /**
   * Handle WebRTC answer from mobile
   */
  async handleAnswer(answer) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ WebRTC connection established');
    }
  }
  
  /**
   * Start streaming frames to mobile
   */
  startFrameStreaming() {
    const streamFrame = () => {
      if (!this.isStreaming) return;
      
      const now = Date.now();
      if (now - this.lastFrameTime >= this.frameInterval) {
        this.captureAndSendFrame();
        this.lastFrameTime = now;
      }
      
      requestAnimationFrame(streamFrame);
    };
    
    streamFrame();
  }
  
  /**
   * Capture and send current frame
   */
  captureAndSendFrame() {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;
    
    try {
      // Render current scene
      this.renderer.render(this.scene, this.camera);
      
      // Capture canvas as blob
      this.renderer.domElement.toBlob((blob) => {
        if (blob && this.dataChannel.readyState === 'open') {
          blob.arrayBuffer().then(buffer => {
            try {
              this.dataChannel.send(buffer);
            } catch (error) {
              console.error('Error sending frame:', error);
            }
          });
        }
      }, 'image/jpeg', this.quality);
    } catch (error) {
      console.error('Frame capture error:', error);
    }
  }
  
  /**
   * Update camera based on mobile head movement
   */
  updateCameraFromMobile(rotation) {
    if (!this.camera) return;
    
    // Apply rotation from mobile gyroscope
    this.mobileRotation = rotation;
    
    // Update camera rotation (smooth interpolation)
    const lerpFactor = 0.15;
    this.camera.rotation.x += (rotation.x - this.camera.rotation.x) * lerpFactor;
    this.camera.rotation.y += (rotation.y - this.camera.rotation.y) * lerpFactor;
    // Limit Z rotation for comfort
    const targetZ = Math.max(-0.3, Math.min(0.3, rotation.z));
    this.camera.rotation.z += (targetZ - this.camera.rotation.z) * lerpFactor;
  }
  
  /**
   * Show QR code modal
   */
  showQRCodeModal() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'vr-qr-modal';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;
    
    // Generate VR URL
    const baseUrl = this.ngrokUrl || window.location.origin;
    const vrUrl = `${baseUrl}/vr-mobile.html?session=${this.sessionId}`;
    
    modal.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">🥽</div>
      <h2 style="margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #1a1a1a;">
        VR Mobile View
      </h2>
      <p style="margin: 0 0 24px; color: #666; font-size: 15px; line-height: 1.5;">
        Scan this QR code with your phone to view in VR mode
      </p>
      <div id="vr-qr-code" style="background: white; padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;"></div>
      <div id="vr-status" style="padding: 12px 20px; background: #f0f0f0; border-radius: 10px; color: #666; font-weight: 600; margin-bottom: 20px;">
        ⏳ Waiting for mobile device...
      </div>
      <div style="margin: 20px 0; padding: 16px; background: #f8f9fa; border-radius: 10px; text-align: left;">
        <div style="font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          Direct Link
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" id="vr-url-input" readonly value="${vrUrl}" 
            style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 12px; font-family: monospace; background: white;">
          <button id="vr-copy-btn" 
            style="padding: 10px 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; white-space: nowrap; transition: background 0.2s;">
            📋 Copy
          </button>
        </div>
      </div>
      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
        <button id="vr-close-btn" 
          style="padding: 12px 24px; background: #f0f0f0; color: #333; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; transition: background 0.2s;">
          Close
        </button>
        <button id="vr-continue-btn" disabled
          style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 10px; cursor: not-allowed; font-weight: 600; font-size: 14px; transition: all 0.2s; opacity: 0.5;">
          Continue to VR
        </button>
      </div>
      <p style="margin: 16px 0 0; font-size: 12px; color: #999;">
        Session ID: <strong style="color: #667eea;">${this.sessionId}</strong>
      </p>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Generate QR code
    this.generateQRCode(vrUrl, 'vr-qr-code');
    
    // Event listeners
    document.getElementById('vr-copy-btn').addEventListener('click', () => {
      const input = document.getElementById('vr-url-input');
      input.select();
      document.execCommand('copy');
      const btn = document.getElementById('vr-copy-btn');
      btn.textContent = '✅ Copied!';
      btn.style.background = '#10b981';
      setTimeout(() => {
        btn.textContent = '📋 Copy';
        btn.style.background = '#667eea';
      }, 2000);
    });
    
    document.getElementById('vr-close-btn').addEventListener('click', () => {
      this.stopVRMode();
      overlay.remove();
    });
    
    document.getElementById('vr-continue-btn').addEventListener('click', () => {
      overlay.remove();
      // Keep VR streaming in background
    });
  }
  
  /**
   * Update modal status
   */
  updateModalStatus(status) {
    const statusDiv = document.getElementById('vr-status');
    const continueBtn = document.getElementById('vr-continue-btn');
    
    if (!statusDiv || !continueBtn) return;
    
    if (status === 'connected') {
      statusDiv.innerHTML = '✅ Mobile device connected!';
      statusDiv.style.background = '#d4edda';
      statusDiv.style.color = '#155724';
      
      continueBtn.disabled = false;
      continueBtn.style.cursor = 'pointer';
      continueBtn.style.opacity = '1';
    } else if (status === 'disconnected') {
      statusDiv.innerHTML = '❌ Mobile device disconnected';
      statusDiv.style.background = '#f8d7da';
      statusDiv.style.color = '#721c24';
      
      continueBtn.disabled = true;
      continueBtn.style.cursor = 'not-allowed';
      continueBtn.style.opacity = '0.5';
    }
  }
  
  /**
   * Generate QR code
   */
  generateQRCode(text, containerId) {
    // Use qrcode.js library
    if (typeof QRCode !== 'undefined') {
      new QRCode(document.getElementById(containerId), {
        text: text,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      // Fallback: show text
      document.getElementById(containerId).innerHTML = `
        <div style="padding: 20px; border: 2px dashed #ccc; border-radius: 8px;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            QR code library not loaded.<br>Please copy the link above.
          </p>
        </div>
      `;
    }
  }
  
  /**
   * Stop VR mode
   */
  stopVRMode() {
    this.isStreaming = false;
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    console.log('🛑 VR mode stopped');
  }
  
  /**
   * Update frame quality
   */
  setQuality(quality) {
    this.quality = Math.max(0.1, Math.min(1.0, quality));
  }
  
  /**
   * Update frame rate
   */
  setFrameRate(fps) {
    this.frameInterval = 1000 / Math.max(10, Math.min(60, fps));
  }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
document.head.appendChild(style);
