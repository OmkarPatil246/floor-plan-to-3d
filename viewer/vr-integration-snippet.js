/**
 * VR Integration Snippet
 * Add this code to your viewer's main JavaScript file
 */

// Import VR Integration (add to top of file)
import { VRIntegration } from './vr-integration.js';

// Initialize VR after scene, camera, and renderer are created
let vrIntegration = null;

function initializeVR() {
  // Make sure scene, camera, and renderer exist
  if (window.scene && window.camera && window.renderer) {
    vrIntegration = new VRIntegration(window.scene, window.camera, window.renderer);
    console.log('✅ VR Integration initialized');
  } else {
    console.error('❌ Cannot initialize VR: scene, camera, or renderer not found');
  }
}

// Call after Three.js setup is complete
// Add this after your existing scene setup
// initializeVR();

// Event listener for VR button
document.addEventListener('DOMContentLoaded', () => {
  const vrButton = document.getElementById('vr-mode-btn');
  
  if (vrButton) {
    vrButton.addEventListener('click', async () => {
      if (!vrIntegration) {
        initializeVR();
      }
      
      if (vrIntegration) {
        try {
          await vrIntegration.startVRMode();
        } catch (error) {
          console.error('❌ Failed to start VR mode:', error);
          alert('Failed to start VR mode. Make sure the VR server is running.');
        }
      }
    });
  }
});

// Optional: Add VR quality controls
function addVRControls() {
  const controlsHTML = `
    <div class="label">VR Settings</div>
    <div style="margin-top: 8px;">
      <label style="display: block; font-size: 11px; color: var(--muted); margin-bottom: 4px;">
        Streaming Quality
      </label>
      <input type="range" id="vr-quality-slider" min="0.3" max="1.0" step="0.1" value="0.7" 
        style="width: 100%;">
      <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); margin-top: 2px;">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
    <div style="margin-top: 8px;">
      <label style="display: block; font-size: 11px; color: var(--muted); margin-bottom: 4px;">
        Frame Rate (FPS)
      </label>
      <select id="vr-fps-select" style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid var(--hairline);">
        <option value="15">15 FPS (Low bandwidth)</option>
        <option value="20">20 FPS (Balanced)</option>
        <option value="30" selected>30 FPS (Smooth)</option>
      </select>
    </div>
  `;
  
  // Insert before the VR button
  const vrButton = document.getElementById('vr-mode-btn');
  if (vrButton) {
    const container = vrButton.closest('.row');
    if (container) {
      container.insertAdjacentHTML('beforebegin', controlsHTML);
      
      // Event listeners
      document.getElementById('vr-quality-slider').addEventListener('input', (e) => {
        if (vrIntegration) {
          vrIntegration.setQuality(parseFloat(e.target.value));
        }
      });
      
      document.getElementById('vr-fps-select').addEventListener('change', (e) => {
        if (vrIntegration) {
          vrIntegration.setFrameRate(parseInt(e.target.value));
        }
      });
    }
  }
}

// Call this after DOM is loaded if you want VR controls
// addVRControls();

/**
 * COMPLETE INTEGRATION EXAMPLE
 * 
 * Add to your main viewer code:
 */

/*
// 1. Import at top of file
import { VRIntegration } from './vr-integration.js';

// 2. Initialize after scene setup
let vrIntegration = null;

function setupViewer() {
  // Your existing Three.js setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(...);
  const renderer = new THREE.WebGLRenderer(...);
  
  // ... rest of your setup ...
  
  // Initialize VR
  vrIntegration = new VRIntegration(scene, camera, renderer);
  
  // Add VR button listener
  document.getElementById('vr-mode-btn').addEventListener('click', async () => {
    await vrIntegration.startVRMode();
  });
}

// 3. Make sure to keep rendering in your animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Your existing animation code
  // VR integration will automatically update camera based on mobile gyroscope
  
  renderer.render(scene, camera);
}
*/

/**
 * WALKTHROUGH MODE INTEGRATION
 * 
 * If you have a walkthrough/FPS mode, you can sync it with VR:
 */

/*
function enterWalkthroughMode() {
  // Your existing walkthrough code
  
  // If VR is active, mobile gyroscope will control camera rotation
  // You can still control position via keyboard/mouse on desktop
}

// Optional: Display VR status in walkthrough HUD
function updateWalkthroughHUD() {
  if (vrIntegration && vrIntegration.isConnected) {
    // Show VR active indicator
    document.getElementById('vr-indicator').style.display = 'block';
  }
}
*/

/**
 * MOBILE GYROSCOPE DATA
 * 
 * Access mobile head movement data:
 */

/*
// The camera rotation is automatically updated
// But you can access the raw data if needed:

if (vrIntegration) {
  const rotation = vrIntegration.mobileRotation;
  console.log('Mobile head rotation:', rotation);
  // rotation = { x: radians, y: radians, z: radians }
}
*/

/**
 * CLEANUP
 * 
 * When switching scenes or exiting:
 */

/*
function exitViewer() {
  // Stop VR mode
  if (vrIntegration) {
    vrIntegration.stopVRMode();
  }
  
  // Your other cleanup code
}
*/

export { initializeVR, addVRControls };
