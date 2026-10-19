import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';

// ─── Application State ──────────────────────────────────────────────────────
const state = {
  timeOfDay: 12,
  sunAltitude: 50,
  fogDensity: 0.0015,
  autoOrbit: false,
  showPlotGuide: true,
  showSampleHouse: false,
  shadowsEnabled: true,
  treesEnabled: true,
  walkMode: false,
  fps: 60
};

// ─── Core Three.js Variables ─────────────────────────────────────────────────
let scene, camera, renderer, controls;
let sky, sunLight, ambientLight, hemiLight;
let terrainMesh;
let plotGuideGroup, sampleHouseGroup;
let vegetationGroup;

// ─── Terrain Constants ───────────────────────────────────────────────────────
const TERRAIN_SIZE = 800;          // 800m × 800m massive ground plane
const TERRAIN_SEGMENTS = 220;      // enough detail for ridges & hills
const PLOT_CLEAR_RADIUS = 25;      // flat plot radius (50m diameter)

// ─── AR/VR Walk Mode State ────────────────────────────────────────────────────
const walkState = {
  active: false,
  velocity: new THREE.Vector3(),
  yaw: 0,             // horizontal camera angle (radians)
  pitch: 0,           // vertical camera angle (radians)
  playerPos: new THREE.Vector3(0, 2.0, 24),  // start outside plot
  speed: 5.0,
  sprintMultiplier: 2.2,
  eyeHeight: 2.0,
  collidingObjects: [],   // { position: Vector3, radius: number }
  isColliding: false,
  collisionTimer: 0
};
const keysDown = {};

// ─── Culling Engine ───────────────────────────────────────────────────────────
const cameraFrustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();
const cullingObjects = [];      // { mesh, position, radius }

// ─── Loading Manager ─────────────────────────────────────────────────────────
const loadingManager = new THREE.LoadingManager();
const progressBar = document.getElementById('progress-bar');
const progressStatus = document.getElementById('progress-status');
const loadingOverlay = document.getElementById('loading-overlay');

loadingManager.onProgress = (url, loaded, total) => {
  const pct = Math.round((loaded / total) * 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressStatus) progressStatus.innerText = `Loading (${pct}%)… ${url.split('/').pop()}`;
};
loadingManager.onLoad = () => {
  if (progressStatus) progressStatus.innerText = 'Building 800m landscape…';
  setTimeout(() => { if (loadingOverlay) loadingOverlay.classList.add('hidden'); }, 600);
};

// ─── Terrain Height Helper (must match vertex shader) ─────────────────────────
function getTerrainHeight(x, z) {
  const dist = Math.sqrt(x * x + z * z);
  if (dist <= PLOT_CLEAR_RADIUS) return 0;

  // Flat gentle terrain near house, mountains only beyond 200m+
  const nearBlend = Math.min((dist - PLOT_CLEAR_RADIUS) / 180, 1.0);  // very gradual transition
  const farBlend  = Math.max(0, Math.min((dist - 200) / 120, 1.0));   // mountains start at 200m+

  // Gentle rolling hills (near area)
  const h1 = Math.sin(x * 0.022) * Math.cos(z * 0.022) * 3.0;
  const h2 = Math.sin(x * 0.055 + 1.3) * Math.sin(z * 0.055 + 0.7) * 1.5;

  // Mountain ridges (far area only)
  const h3 = Math.cos(x * 0.01 - 0.5) * Math.sin(z * 0.01 + 1.0) * 20.0;
  const h4 = Math.sin(x * 0.004 + 0.8) * Math.cos(z * 0.004 - 0.4) * 45.0;

  return (h1 + h2) * nearBlend + (h3 + h4) * farBlend;
}

// ─── Initialization ───────────────────────────────────────────────────────────
function init() {
  const container = document.getElementById('canvas-container');

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Scene & Fog
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xbae6fd, state.fogDensity);

  // Camera — slightly higher up for the vastness
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 3000);
  camera.position.set(55, 38, 65);

  // Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minDistance = 5;
  controls.maxDistance = 600;
  controls.target.set(0, 2, 0);
  controls.update();

  setupAtmosphere();
  setupTerrain();
  setupHousePlotGuide();
  setupVegetation();
  setupUI();
  setupWalkMode();

  window.addEventListener('resize', onWindowResize);
  animate();
}

// ─── Atmosphere & Dynamic Sun ──────────────────────────────────────────────────
function setupAtmosphere() {
  // Atmospheric Sky Dome
  sky = new Sky();
  sky.scale.setScalar(2500000);
  scene.add(sky);

  const su = sky.material.uniforms;
  su['turbidity'].value = 3.0;
  su['rayleigh'].value = 2.8;          // vivid azure blue sky
  su['mieCoefficient'].value = 0.003;
  su['mieDirectionalG'].value = 0.84;

  // Hemisphere — sky blue above, earth green below
  hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x166534, 1.3);
  hemiLight.position.set(0, 100, 0);
  scene.add(hemiLight);

  // Sun Directional Light — primary shadow caster + specular reflections on leaves
  sunLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 500;
  const sd = 90;
  sunLight.shadow.camera.left  = -sd;
  sunLight.shadow.camera.right =  sd;
  sunLight.shadow.camera.top   =  sd;
  sunLight.shadow.camera.bottom = -sd;
  sunLight.shadow.bias = -0.0002;
  scene.add(sunLight);

  // Ambient fill
  ambientLight = new THREE.AmbientLight(0xbae6fd, 0.4);
  scene.add(ambientLight);

  updateSunPosition();
}

function updateSunPosition() {
  const h = state.timeOfDay;
  const azimuth = ((h - 6) / 12) * Math.PI;
  const altRad  = (state.sunAltitude * Math.PI) / 180;

  const sunPos = new THREE.Vector3();
  sunPos.setFromSphericalCoords(300, Math.PI / 2 - Math.sin(azimuth) * altRad, azimuth);

  sky.material.uniforms['sunPosition'].value.copy(sunPos);
  sunLight.position.copy(sunPos);

  const sunH = sunPos.y;
  if (sunH < 0) {
    sunLight.intensity  = 0.05;
    ambientLight.intensity = 0.1;
    hemiLight.intensity = 0.15;
    scene.fog.color.setHex(0x081325);
  } else {
    const d = Math.min(sunH / 100, 1.0);
    sunLight.intensity  = 1.8 + d * 1.2;
    ambientLight.intensity = 0.35 + d * 0.25;
    hemiLight.intensity = 0.9  + d * 0.5;

    if (h < 8 || h > 17) {
      sunLight.color.setHex(0xfb923c);
      scene.fog.color.setHex(0xfde68a);
    } else {
      sunLight.color.setHex(0xfff7ed);
      scene.fog.color.setHex(0xbae6fd);
    }
  }
}



// ─── 800m Terrain with Ridges & Multi-Texture Blending ───────────────────────
function setupTerrain() {
  const texLoader = new THREE.TextureLoader(loadingManager);

  const grassTex = texLoader.load('grass.avif');
  const mudTex   = texLoader.load('mud.webp');

  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  mudTex.wrapS   = mudTex.wrapT   = THREE.RepeatWrapping;

  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
  geo.rotateX(-Math.PI / 2);

  // Apply heightmap to each vertex
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, getTerrainHeight(x, z));
  }
  geo.computeVertexNormals();

  // Custom shader blending grass + mud based on world position
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.05, map: grassTex });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uMudMap = { value: mudTex };

    shader.vertexShader = `varying vec3 vWorldPos;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
    );

    shader.fragmentShader = `uniform sampler2D uMudMap;\nvarying vec3 vWorldPos;\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      vec2 gUV = vWorldPos.xz * 0.10;
      vec2 mUV = vWorldPos.xz * 0.07;
      vec4 grassC = texture2D(map, gUV);
      vec4 mudC   = texture2D(uMudMap, mUV);

      float dPlot   = length(vWorldPos.xz);
      float dDrive  = abs(vWorldPos.x);

      // Mud driveway from plot toward camera
      float drvMask = smoothstep(6.0, 2.5, dDrive)
                    * smoothstep(-8.0, 12.0, vWorldPos.z)
                    * smoothstep(120.0, 28.0, vWorldPos.z);
      // Plot clearing
      float plotMask = smoothstep(${PLOT_CLEAR_RADIUS.toFixed(1)}, ${(PLOT_CLEAR_RADIUS * 0.6).toFixed(1)}, dPlot);
      float mudBlend = clamp(plotMask + drvMask, 0.0, 1.0);
      diffuseColor = mix(grassC, mudC, mudBlend);
      `
    );
  };

  terrainMesh = new THREE.Mesh(geo, mat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);
}

// ─── House Plot Guide (40m × 35m) ────────────────────────────────────────────
function setupHousePlotGuide() {
  plotGuideGroup = new THREE.Group();

  // Dashed 3D bounding box 40m × 35m
  const wireGeo = new THREE.WireframeGeometry(new THREE.BoxGeometry(40, 8, 35));
  const wireMat = new THREE.LineDashedMaterial({
    color: 0x38bdf8, dashSize: 1.0, gapSize: 0.5,
    transparent: true, opacity: 0.85, linewidth: 2
  });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  wire.computeLineDistances();
  wire.position.set(0, 4, 0);
  plotGuideGroup.add(wire);

  // Corner survey stakes
  [[-20,-17.5],[20,-17.5],[-20,17.5],[20,17.5]].forEach(([cx, cz]) => {
    const stk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
    );
    stk.position.set(cx, 1.1, cz);
    stk.castShadow = true;
    plotGuideGroup.add(stk);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    ball.position.set(cx, 2.4, cz);
    plotGuideGroup.add(ball);
  });

  // Center crosshair ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 1.4, 32),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  ring.geometry.rotateX(-Math.PI / 2);
  ring.position.set(0, 0.06, 0);
  plotGuideGroup.add(ring);

  scene.add(plotGuideGroup);

  // Sample preview house (toggleable)
  sampleHouseGroup = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(28, 6, 22),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.8 })
  );
  body.position.set(0, 3, 0);
  body.castShadow = true; body.receiveShadow = true;
  sampleHouseGroup.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(20, 5, 4),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 8.5, 0);
  roof.scale.set(1.1, 1, 0.9);
  roof.castShadow = true;
  sampleHouseGroup.add(roof);

  sampleHouseGroup.visible = false;
  scene.add(sampleHouseGroup);
}

// ─── Load & Scatter Vegetation — Trees, Bushes, Rocks ────────────────────────
function setupVegetation() {
  vegetationGroup = new THREE.Group();
  scene.add(vegetationGroup);

  const loader = new GLTFLoader(loadingManager);
  loader.load('low_poly_forest_tree_pack.glb', (gltf) => {

    const treePrefabs = [], bushPrefabs = [], rockPrefabs = [];

    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;
      const name = child.name.toLowerCase();
      const prefab = makePrefab(child);
      if (name.includes('rock'))                               rockPrefabs.push(prefab);
      else if (name.includes('trunk') || name.includes('tree') || name.includes('branch') || name.includes('atlas')) treePrefabs.push(prefab);
      else                                                      bushPrefabs.push(prefab);
    });

    if (treePrefabs.length === 0) { populateProceduralTrees(); return; }

    scatter(treePrefabs, 220, 28, 390, 0.7, 1.6, 'tree');
    scatter(bushPrefabs.length ? bushPrefabs : treePrefabs, 120, 25, 350, 0.2, 0.6, 'bush');
    scatter(rockPrefabs, 80, 22, 340, 0.4, 1.8, 'rock');

  }, undefined, () => populateProceduralTrees());
}

// Prepare a single mesh prefab — correct Z-up geometry, center, sunlight materials
function makePrefab(mesh) {
  const clone  = mesh.clone();
  clone.geometry = mesh.geometry.clone();

  clone.geometry.computeBoundingBox();
  const box = clone.geometry.boundingBox;
  const sY = box.max.y - box.min.y;
  const sZ = box.max.z - box.min.z;

  // FBX models often export with Z-up axis — correct to Y-up
  if (sZ > sY * 1.25) clone.geometry.rotateX(-Math.PI / 2);

  // Snap geometry base to Y = 0 (terrain surface contact)
  clone.geometry.computeBoundingBox();
  const minY = clone.geometry.boundingBox.min.y;
  clone.geometry.translate(0, -minY, 0);

  if (clone.material) {
    clone.material = clone.material.clone();
    clone.material.roughness = 0.45;
    clone.material.metalness = 0.05;
  }
  return clone;
}

/**
 * Scatter vegetation instances around the landscape.
 * Every instance is terrain-snapped via getTerrainHeight().
 */
function scatter(prefabs, count, minDist, maxDist, minScale, maxScale, kind) {
  if (!prefabs || prefabs.length === 0) return;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist  = minDist + Math.random() * (maxDist - minDist);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    // Keep driveway clear (straight strip from plot toward z+)
    if (z > -12 && z < 100 && Math.abs(x) < 12) continue;

    const pf  = prefabs[Math.floor(Math.random() * prefabs.length)];
    const obj = pf.clone();

    const s = minScale + Math.random() * (maxScale - minScale);
    obj.scale.set(s, s, s);

    // ── GRAVITY: snap base to terrain surface ──
    const groundY = getTerrainHeight(x, z);
    obj.position.set(x, groundY, z);
    obj.rotation.y = Math.random() * Math.PI * 2;

    obj.castShadow    = true;
    obj.receiveShadow = true;

    vegetationGroup.add(obj);

    // Register for frustum culling
    registerCull(obj);

    // Register for walk-mode collision (trees & rocks only, not tiny bushes)
    if (kind === 'tree' || kind === 'rock') {
      walkState.collidingObjects.push({
        position: obj.position.clone(),
        radius: (kind === 'tree' ? 1.6 : 1.2) * s
      });
    }
  }
}

// Fallback procedural trees when GLB fails
function populateProceduralTrees() {
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
  const leafM  = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.45 });

  for (let i = 0; i < 100; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist  = 28 + Math.random() * 280;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (z > -12 && z < 100 && Math.abs(x) < 12) continue;

    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 5, 8), trunkM);
    trunk.position.y = 2.5; trunk.castShadow = true; tree.add(trunk);

    const leaves = new THREE.Mesh(new THREE.ConeGeometry(3.0, 7, 8), leafM);
    leaves.position.y = 7.5; leaves.castShadow = true; tree.add(leaves);

    const gY = getTerrainHeight(x, z);
    tree.position.set(x, gY, z);
    const s = 0.8 + Math.random() * 0.7;
    tree.scale.set(s, s, s);

    vegetationGroup.add(tree);
    registerCull(tree);
    walkState.collidingObjects.push({ position: tree.position.clone(), radius: 1.6 * s });
  }
}

// ─── Frustum Culling Registration ─────────────────────────────────────────────
function registerCull(obj) {
  obj.matrixAutoUpdate = false;
  obj.updateMatrix();
  obj.traverse(c => {
    if (c.isMesh) {
      c.matrixAutoUpdate = false;
      c.updateMatrix();
      if (c.geometry && !c.geometry.boundingSphere) c.geometry.computeBoundingSphere();
    }
  });

  let bs = null;
  if (obj.geometry) {
    if (!obj.geometry.boundingSphere) obj.geometry.computeBoundingSphere();
    bs = obj.geometry.boundingSphere.clone();
  }

  cullingObjects.push({ mesh: obj, position: obj.position.clone(), bs });
}

// ─── Frustum & Distance Culling (runs every-other frame) ─────────────────────
const _worldSphere = new THREE.Sphere();
let cullFrame = 0;
function updateCulling() {
  if (++cullFrame % 2 !== 0) return;

  projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  cameraFrustum.setFromProjectionMatrix(projScreenMatrix);

  const camPos   = camera.position;
  const maxDistSq = 300 * 300;  // cull beyond 300 m

  for (const item of cullingObjects) {
    const mesh = item.mesh;
    const dSq  = item.position.distanceToSquared(camPos);

    if (dSq > maxDistSq) { mesh.visible = false; continue; }

    if (item.bs) {
      _worldSphere.copy(item.bs).applyMatrix4(mesh.matrixWorld);
      mesh.visible = cameraFrustum.intersectsSphere(_worldSphere);
    } else {
      mesh.visible = cameraFrustum.intersectsObject(mesh);
    }
  }
}

// ─── AR/VR Walk Mode ──────────────────────────────────────────────────────────
function setupWalkMode() {
  document.addEventListener('keydown', e => { keysDown[e.code] = true; });
  document.addEventListener('keyup',   e => { keysDown[e.code] = false; });

  // Mouse drag to look around in walk mode
  let pointerLocked = false;
  renderer.domElement.addEventListener('click', () => {
    if (walkState.active && !pointerLocked) {
      renderer.domElement.requestPointerLock();
    }
  });
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === renderer.domElement;
  });
  document.addEventListener('mousemove', (e) => {
    if (!walkState.active || !pointerLocked) return;
    walkState.yaw   -= e.movementX * 0.002;
    walkState.pitch -= e.movementY * 0.002;
    walkState.pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, walkState.pitch));
  });

  // ESC exits walk mode
  document.addEventListener('keydown', e => {
    if (e.code === 'Escape' && walkState.active) exitWalkMode();
  });
}

function enterWalkMode() {
  walkState.active = true;
  state.walkMode   = true;

  // Disable orbit controls
  controls.enabled = false;

  // Position player starting at current camera orbital target, outside plot
  walkState.playerPos.set(0, 2.0, 30);
  walkState.yaw   = Math.PI;   // face the plot
  walkState.pitch = 0;

  // Show walk UI
  document.getElementById('walk-crosshair').classList.remove('hidden');
  document.getElementById('walk-hud').classList.remove('hidden');
  document.getElementById('env-status').innerText = '🚶 Walk Mode';

  // Mark button
  document.querySelectorAll('.button-grid .btn').forEach(b => b.classList.remove('active'));
  document.getElementById('cam-walk').classList.add('active');
}

function exitWalkMode() {
  walkState.active = false;
  state.walkMode   = false;

  controls.enabled = true;
  controls.update();

  document.getElementById('walk-crosshair').classList.add('hidden');
  document.getElementById('walk-hud').classList.add('hidden');
  document.getElementById('env-status').innerText = '⚡ Orbit Mode';

  if (document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock();
  }

  document.querySelectorAll('.button-grid .btn').forEach(b => b.classList.remove('active'));
  document.getElementById('cam-overview').classList.add('active');
}

// ─── Walk Mode Per-Frame Update ───────────────────────────────────────────────
const _moveDir = new THREE.Vector3();
const _tmpPos  = new THREE.Vector3();

function updateWalkMode(dt) {
  if (!walkState.active) return;

  const sprint = keysDown['ShiftLeft'] || keysDown['ShiftRight'];
  const speed  = walkState.speed * (sprint ? walkState.sprintMultiplier : 1.0);

  // Turn left / right via A/D or arrow keys
  if (keysDown['ArrowLeft']  || keysDown['KeyA']) walkState.yaw += 1.6 * dt;
  if (keysDown['ArrowRight'] || keysDown['KeyD']) walkState.yaw -= 1.6 * dt;

  // Forward / backward movement
  let moveZ = 0;
  if (keysDown['ArrowUp']   || keysDown['KeyW']) moveZ -= 1;
  if (keysDown['ArrowDown'] || keysDown['KeyS']) moveZ += 1;

  if (moveZ !== 0) {
    _moveDir.set(Math.sin(walkState.yaw) * moveZ, 0, Math.cos(walkState.yaw) * moveZ);
    _moveDir.normalize().multiplyScalar(speed * dt);

    _tmpPos.copy(walkState.playerPos).add(_moveDir);

    // ── Collision Detection ──────────────────────────────────────────────────
    const playerRadius = 0.55;
    let blocked = false;
    for (const obj of walkState.collidingObjects) {
      const dx = _tmpPos.x - obj.position.x;
      const dz = _tmpPos.z - obj.position.z;
      const distSq = dx * dx + dz * dz;
      const minDist = playerRadius + obj.radius;
      if (distSq < minDist * minDist) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      walkState.playerPos.copy(_tmpPos);
    }

    // Show / hide collision indicator
    if (blocked !== walkState.isColliding) {
      walkState.isColliding = blocked;
      const ind = document.getElementById('collision-indicator');
      if (blocked) {
        ind.classList.remove('hidden');
        walkState.collisionTimer = 1.5;
      }
    }
  }

  // Auto-hide collision indicator after timeout
  if (walkState.collisionTimer > 0) {
    walkState.collisionTimer -= dt;
    if (walkState.collisionTimer <= 0) {
      document.getElementById('collision-indicator').classList.add('hidden');
    }
  }

  // Keep terrain gravity — snap player Y to terrain height + eye height
  const groundY = getTerrainHeight(walkState.playerPos.x, walkState.playerPos.z);
  walkState.playerPos.y = groundY + walkState.eyeHeight;

  // Move camera to player position, apply yaw + pitch
  camera.position.copy(walkState.playerPos);
  const euler = new THREE.Euler(walkState.pitch, walkState.yaw, 0, 'YXZ');
  camera.quaternion.setFromEuler(euler);
}



// ─── UI Controls ──────────────────────────────────────────────────────────────
function setupUI() {
  // Camera presets
  document.getElementById('cam-overview').addEventListener('click', () => moveCamera(55, 38, 65,  0, 2, 0, 'cam-overview'));
  document.getElementById('cam-plot')    .addEventListener('click', () => moveCamera(25, 14, 28,  0, 2, 0, 'cam-plot'));
  document.getElementById('cam-ground')  .addEventListener('click', () => moveCamera( 0, 3.5, 35, 0, 2, 0, 'cam-ground'));
  document.getElementById('cam-topdown') .addEventListener('click', () => moveCamera( 0, 90, 0.1, 0, 0, 0, 'cam-topdown'));

  document.getElementById('cam-walk').addEventListener('click', () => {
    if (walkState.active) exitWalkMode(); else enterWalkMode();
  });

  document.getElementById('cam-orbit').addEventListener('click', (e) => {
    if (walkState.active) exitWalkMode();
    state.autoOrbit = !state.autoOrbit;
    controls.autoRotate = state.autoOrbit;
    controls.autoRotateSpeed = 1.2;
    e.target.classList.toggle('active', state.autoOrbit);
  });

  // Time of day
  const tSlider = document.getElementById('slider-time');
  const tVal    = document.getElementById('val-time');
  tSlider.addEventListener('input', e => {
    state.timeOfDay = parseFloat(e.target.value);
    const h = Math.floor(state.timeOfDay);
    const m = Math.floor((state.timeOfDay % 1) * 60);
    tVal.innerText = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} (${h >= 6 && h <= 18 ? 'Day' : 'Night'})`;
    updateSunPosition();
  });

  // Sun altitude
  const aSlider = document.getElementById('slider-altitude');
  const aVal    = document.getElementById('val-altitude');
  aSlider.addEventListener('input', e => {
    state.sunAltitude = parseFloat(e.target.value);
    aVal.innerText = `${state.sunAltitude}°`;
    updateSunPosition();
  });

  // Fog
  const fSlider = document.getElementById('slider-fog');
  const fVal    = document.getElementById('val-fog');
  fSlider.addEventListener('input', e => {
    state.fogDensity = parseFloat(e.target.value);
    scene.fog.density = state.fogDensity;
    const labels = ['Off','Low','Medium','Heavy','Dense'];
    fVal.innerText = labels[Math.min(Math.floor((state.fogDensity / 0.015) * 4), 4)];
  });

  // Toggles
  document.getElementById('toggle-plot')        .addEventListener('change', e => { plotGuideGroup.visible  = e.target.checked; });
  document.getElementById('toggle-sample-house').addEventListener('change', e => { sampleHouseGroup.visible = e.target.checked; });
  document.getElementById('toggle-trees')       .addEventListener('change', e => { vegetationGroup.visible  = e.target.checked; });
  document.getElementById('toggle-shadows')     .addEventListener('change', e => {
    renderer.shadowMap.enabled = e.target.checked;
    scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  });
}

// ─── Smooth Camera Transition ─────────────────────────────────────────────────
function moveCamera(px, py, pz, tx, ty, tz, btnId) {
  if (walkState.active) exitWalkMode();
  state.autoOrbit = false;
  controls.autoRotate = false;
  document.getElementById('cam-orbit').classList.remove('active');

  document.querySelectorAll('.button-grid .btn').forEach(b => b.classList.remove('active'));
  if (btnId) { const b = document.getElementById(btnId); if (b) b.classList.add('active'); }

  const startPos = camera.position.clone();
  const endPos   = new THREE.Vector3(px, py, pz);
  const startTgt = controls.target.clone();
  const endTgt   = new THREE.Vector3(tx, ty, tz);
  const dur = 1000, t0 = performance.now();

  (function anim(now) {
    const t = Math.min((now - t0) / dur, 1.0);
    const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    camera.position.lerpVectors(startPos, endPos, e);
    controls.target.lerpVectors(startTgt, endTgt, e);
    controls.update();
    if (t < 1.0) requestAnimationFrame(anim);
  })(t0);
}

// ─── Window Resize ─────────────────────────────────────────────────────────────
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ─── FPS Counter ──────────────────────────────────────────────────────────────
let frameCount = 0, lastFpsTime = performance.now();
const fpsEl = document.getElementById('fps-counter');
function updateFPS(now) {
  frameCount++;
  if (now - lastFpsTime >= 1000) {
    if (fpsEl) fpsEl.innerText = Math.round((frameCount * 1000) / (now - lastFpsTime));
    frameCount = 0; lastFpsTime = now;
  }
}

// ─── Main Animation Loop ──────────────────────────────────────────────────────
let lastTime = performance.now();
function animate(now = performance.now()) {
  requestAnimationFrame(animate);

  const dt = Math.min((now - lastTime) / 1000, 0.05);  // delta-time in seconds
  lastTime = now;

  updateFPS(now);

  if (walkState.active) {
    updateWalkMode(dt);
  } else {
    controls.update();
  }

  updateCulling();

  renderer.render(scene, camera);
}

// ─── Global Integration API ───────────────────────────────────────────────────
window.placeHouseModel = function(houseMesh) {
  if (!houseMesh) return;
  houseMesh.position.set(0, 0.15, 0);
  houseMesh.traverse(c => {
    if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
  });
  scene.add(houseMesh);
  moveCamera(30, 18, 35, 0, 4, 0, 'cam-plot');
  console.log('✅ House model placed at (0, 0, 0) — 40m × 35m plot');
};

// ─── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);
