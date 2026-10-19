/**
 * wall.js
 * -------------------------------------------------------------------------
 * Realistic interior WALL asset for Three.js — SCALE-SAFE version.
 *
 * WHY THIS VERSION EXISTS
 * Earlier versions used fixed absolute sizes for details (skirting height,
 * skirting protrusion, etc). That looks right only near the original
 * demo dimensions — shrink the wall and the skirting stays the same
 * absolute thickness, so it visually overwhelms a small wall; enlarge the
 * wall and the same skirting looks like a thin line. This version instead
 * scales every detail by the wall's own size relative to a reference
 * size, so the wall looks like the SAME design at any width/height
 * (geometric similarity, like scaling a photo) — with safety clamps so
 * extreme aspect ratios never produce inverted/negative geometry.
 *
 * Coordinate convention (shared by every asset in this set):
 *   - Origin (0,0,0) = bottom-center of the wall footprint.
 *   - +X -> width, +Y -> up (height), +Z -> thickness (centered on Z=0;
 *            front face at +depth/2, back face at -depth/2)
 *
 * INTERACTION API:
 *   wall.userData.isInteractable   -> true
 *   wall.userData.type             -> 'wall'
 *   wall.userData.supportsTexture  -> true  (wall + door only, per spec)
 *   wall.userData.applyTexture(urlOrTexture)
 *   wall.userData.resetTexture()
 *   wall.userData.resize(newOptions) -> rebuilds this SAME group in place
 *       with new dimensions/options (merges over the original options),
 *       so anything referencing this THREE.Group (parent, position,
 *       other code) keeps working without re-adding it to the scene.
 *
 * Usage:
 *   import { createWall } from './wall.js';
 *   const wall = createWall({ width: 3, height: 2.8 });
 *   scene.add(wall);
 *   ...
 *   wall.userData.resize({ width: 1.1, height: 2.4 }); // still looks right
 * -------------------------------------------------------------------------
 */

import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

// Reference size the detail proportions were designed at.
const REF_WIDTH = 3.0;
const REF_HEIGHT = 2.8;

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

/** Adds dark, low-opacity edge lines to a mesh for a crisp "real" silhouette. */
function addEdges(mesh, color = 0x1a1a1a, opacity = 0.15) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 20);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  mesh.add(line);
  return line;
}

// -------------------------------------------------------------------------
// Photometric Light Scatter Gradient Generators (Realistic Ceiling & Wall Washes)
// -------------------------------------------------------------------------
let _cachedCeilingScatterTex = null;
function getCeilingScatterTexture() {
  if (_cachedCeilingScatterTex) return _cachedCeilingScatterTex;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  // Horizontal gradient: X=0 (closest to wall light strip) -> X=256 (outer ceiling fade)
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0.00, 'rgba(255, 252, 238, 0.95)');
  grad.addColorStop(0.12, 'rgba(255, 230, 160, 0.80)');
  grad.addColorStop(0.30, 'rgba(255, 205, 115, 0.52)');
  grad.addColorStop(0.55, 'rgba(255, 175, 80, 0.25)');
  grad.addColorStop(0.80, 'rgba(255, 150, 55, 0.08)');
  grad.addColorStop(1.00, 'rgba(255, 135, 40, 0.00)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  _cachedCeilingScatterTex = texture;
  return texture;
}

let _cachedWallGrazingTex = null;
function getWallGrazingScatterTexture() {
  if (_cachedWallGrazingTex) return _cachedWallGrazingTex;

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Vertical gradient: Y=0 (top light source at moulding base) -> Y=256 (downward wall falloff)
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.00, 'rgba(255, 250, 230, 0.90)');
  grad.addColorStop(0.15, 'rgba(255, 225, 150, 0.68)');
  grad.addColorStop(0.35, 'rgba(255, 195, 105, 0.38)');
  grad.addColorStop(0.60, 'rgba(255, 165, 70, 0.16)');
  grad.addColorStop(0.85, 'rgba(255, 140, 45, 0.05)');
  grad.addColorStop(1.00, 'rgba(255, 125, 30, 0.00)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  _cachedWallGrazingTex = texture;
  return texture;
}

/**
 * Builds a skirting board (baseboard) strip along the front face of a wall
 * segment, with proportions scaled to the segment's own size. Exported so
 * door/window assemblies can reuse the exact same detail on their lower
 * wall segments.
 *
 * @param {number} scaleFactor geometric-similarity scale vs. the reference
 *        wall size (see computeScaleFactor below) — pass 1 for "reference size".
 */
export function createSkirting({
  width = 3,
  depth = 0.15,
  height = REF_HEIGHT,
  skirtingColor = 0xf6f3ec,
  scaleFactor = null,
} = {}) {
  const s = scaleFactor ?? computeScaleFactor(width, height);

  const skirtingHeight = clamp(0.14 * s, 0.025, height * 0.30);
  const protrusion = clamp(0.022 * s, 0.005, depth * 0.7);

  const group = new THREE.Group();
  group.name = 'skirting';

  const skirtingMat = new THREE.MeshStandardMaterial({
    color: skirtingColor,
    roughness: 0.35,
    metalness: 0.0,
  });

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(width, skirtingHeight, protrusion * 2),
    skirtingMat
  );
  board.position.set(0, skirtingHeight / 2, depth / 2 + protrusion / 2);
  board.castShadow = true;
  board.receiveShadow = true;
  group.add(board);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(width, skirtingHeight * 0.16, protrusion * 2.6),
    skirtingMat
  );
  cap.position.set(0, skirtingHeight - skirtingHeight * 0.08, depth / 2 + protrusion / 1.3);
  cap.castShadow = true;
  group.add(cap);

  addEdges(board, 0x2b2b2b, 0.12);
  addEdges(cap, 0x2b2b2b, 0.1);

  return group;
}

/**
 * Builds a classic rounded architectural crown moulding / ceiling cornice
 * featuring authentic classical Roman Cyma Reversa, Ovolo convex curve,
 * and bottom rounded bead (Torus) detailing.
 *
 * @param {Object} opts
 * @param {number} opts.width
 * @param {number} opts.depth
 * @param {number} opts.height
 * @param {number} opts.mouldingColor
 * @param {number} opts.scaleFactor
 * @returns {THREE.Group}
 */
export function createUpperMoulding({
  width = 3,
  depth = 0.15,
  height = REF_HEIGHT,
  mouldingColor = 0xf6f3ea,
  scaleFactor = null,
} = {}) {
  const s = scaleFactor ?? computeScaleFactor(width, height);

  const totalHeight = clamp(0.18 * s, 0.055, height * 0.20);
  const protrusion = clamp(0.045 * s, 0.016, depth * 0.90);

  const group = new THREE.Group();
  group.name = 'wallUpperLightStripAssembly';

  // Architectural off-white crown moulding material
  const mouldingMat = new THREE.MeshStandardMaterial({
    color: mouldingColor,
    roughness: 0.32,
    metalness: 0.0,
  });

  // Thin translucent glass diffuser lens material with warm interior transmission
  const glassDiffuserMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xffe6c2,
    emissiveIntensity: 0.70,
    roughness: 0.12,
    metalness: 0.02,
    transmission: 0.65,
    ior: 1.52,
    transparent: true,
    opacity: 0.88,
  });

  // Simple warm white LED light core
  const ledCoreMat = new THREE.MeshBasicMaterial({
    color: 0xfffaee,
    toneMapped: false,
  });

  // Subtle warm glow halo
  const glowHaloMat = new THREE.MeshBasicMaterial({
    color: 0xffdfaa,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });

  // -------------------------------------------------------------------------
  // Classic Sculpted 2D Profile:
  // (0,0) -> Bottom fillet -> Rounded Bead -> Cavetto Cove -> Ovolo Round -> Top Ceiling Fascia
  // -------------------------------------------------------------------------
  function createClassicMouldingShape(p, h) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // 1. Bottom fillet step onto wall
    shape.lineTo(p * 0.25, 0);
    // 2. Lower rounded Torus Bead (half-round convex curve)
    shape.bezierCurveTo(p * 0.42, h * 0.05, p * 0.42, h * 0.14, p * 0.28, h * 0.18);
    // 3. Middle Concave Cavetto / Cove Sweep (graceful inward curve)
    shape.bezierCurveTo(p * 0.24, h * 0.38, p * 0.45, h * 0.55, p * 0.65, h * 0.62);
    // 4. Upper Convex Ovolo Crown (grand swelling outward curve)
    shape.bezierCurveTo(p * 0.98, h * 0.72, p * 1.05, h * 0.88, p * 0.96, h * 0.94);
    // 5. Top ceiling fillet
    shape.lineTo(p, h);
    // 6. Top ceiling return line
    shape.lineTo(0, h);
    shape.closePath();
    return shape;
  }

  const profileShape = createClassicMouldingShape(protrusion, totalHeight);

  // Front face classic curved moulding
  const frontGeom = new THREE.ExtrudeGeometry(profileShape, {
    depth: width,
    bevelEnabled: false,
    curveSegments: 20,
  });
  frontGeom.rotateY(Math.PI / 2);
  frontGeom.computeVertexNormals();

  const frontMesh = new THREE.Mesh(frontGeom, mouldingMat);
  frontMesh.position.set(-width / 2, height - totalHeight, depth / 2);
  frontMesh.castShadow = true;
  frontMesh.receiveShadow = true;
  group.add(frontMesh);

  // Back face classic curved moulding
  const backGeom = new THREE.ExtrudeGeometry(profileShape, {
    depth: width,
    bevelEnabled: false,
    curveSegments: 20,
  });
  backGeom.rotateY(-Math.PI / 2);
  backGeom.computeVertexNormals();

  const backMesh = new THREE.Mesh(backGeom, mouldingMat);
  backMesh.position.set(width / 2, height - totalHeight, -depth / 2);
  backMesh.castShadow = true;
  backMesh.receiveShadow = true;
  group.add(backMesh);

  // -------------------------------------------------------------------------
  // Thin Glass Diffuser Light Strip + LED Core on Front & Back Faces
  // -------------------------------------------------------------------------
  const stripH = totalHeight * 0.22;
  const stripThick = protrusion * 0.30;
  const stripY = height - totalHeight * 0.38;

  // Front Glass Light Strip
  const frontGlassGeo = new THREE.BoxGeometry(width, stripH, stripThick);
  const frontGlass = new THREE.Mesh(frontGlassGeo, glassDiffuserMat);
  frontGlass.position.set(0, stripY, depth / 2 + protrusion * 0.82);
  frontGlass.userData.isCoveGlass = true;
  group.add(frontGlass);

  // Front LED Core
  const frontLedGeo = new THREE.BoxGeometry(width, stripH * 0.45, stripThick * 0.4);
  const frontLed = new THREE.Mesh(frontLedGeo, ledCoreMat);
  frontLed.position.set(0, stripY, depth / 2 + protrusion * 0.84);
  frontLed.userData.isCoveCore = true;
  group.add(frontLed);

  // Front Subtle Warm Glow
  const frontGlowGeo = new THREE.BoxGeometry(width, stripH * 1.15, stripThick * 1.2);
  const frontGlow = new THREE.Mesh(frontGlowGeo, glowHaloMat);
  frontGlow.position.set(0, stripY, depth / 2 + protrusion * 0.85);
  frontGlow.userData.isCoveGlow = true;
  group.add(frontGlow);

  // Back Glass Light Strip
  const backGlassGeo = new THREE.BoxGeometry(width, stripH, stripThick);
  const backGlass = new THREE.Mesh(backGlassGeo, glassDiffuserMat);
  backGlass.position.set(0, stripY, -(depth / 2 + protrusion * 0.82));
  backGlass.userData.isCoveGlass = true;
  group.add(backGlass);

  // Back LED Core
  const backLedGeo = new THREE.BoxGeometry(width, stripH * 0.45, stripThick * 0.4);
  const backLed = new THREE.Mesh(backLedGeo, ledCoreMat);
  backLed.position.set(0, stripY, -(depth / 2 + protrusion * 0.84));
  backLed.userData.isCoveCore = true;
  group.add(backLed);

  // Back Subtle Warm Glow
  const backGlowGeo = new THREE.BoxGeometry(width, stripH * 1.15, stripThick * 1.2);
  const backGlow = new THREE.Mesh(backGlowGeo, glowHaloMat);
  backGlow.position.set(0, stripY, -(depth / 2 + protrusion * 0.85));
  backGlow.userData.isCoveGlow = true;
  group.add(backGlow);

  // -------------------------------------------------------------------------
  // Photometric Ceiling & Wall Grazing Light Scatter Washes (Front & Back)
  // -------------------------------------------------------------------------
  const ceilingScatterMat = new THREE.MeshBasicMaterial({
    map: getCeilingScatterTexture(),
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  const wallGrazingMat = new THREE.MeshBasicMaterial({
    map: getWallGrazingScatterTexture(),
    transparent: true,
    opacity: 0.80,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  const ceilingScatterSpread = Math.max(0.12, protrusion * 2.8);
  const wallWashHeight = Math.max(0.18, totalHeight * 1.5);

  // Front Ceiling Scatter Plane (facing down from ceiling at Y = height - 0.001)
  const fCeilGeo = new THREE.PlaneGeometry(width, ceilingScatterSpread);
  fCeilGeo.rotateX(Math.PI / 2);
  fCeilGeo.rotateY(Math.PI);
  const fCeilMesh = new THREE.Mesh(fCeilGeo, ceilingScatterMat);
  fCeilMesh.position.set(0, height - 0.001, depth / 2 + protrusion + ceilingScatterSpread / 2);
  fCeilMesh.renderOrder = 3;
  fCeilMesh.userData.isCeilingScatter = true;
  group.add(fCeilMesh);

  // Back Ceiling Scatter Plane (facing down from ceiling at Y = height - 0.001)
  const bCeilGeo = new THREE.PlaneGeometry(width, ceilingScatterSpread);
  bCeilGeo.rotateX(Math.PI / 2);
  const bCeilMesh = new THREE.Mesh(bCeilGeo, ceilingScatterMat);
  bCeilMesh.position.set(0, height - 0.001, -(depth / 2 + protrusion + ceilingScatterSpread / 2));
  bCeilMesh.renderOrder = 3;
  bCeilMesh.userData.isCeilingScatter = true;
  group.add(bCeilMesh);

  // Front Wall Grazing Scatter Plane (downward wash on wall face)
  const fWallGeo = new THREE.PlaneGeometry(width, wallWashHeight);
  const fWallMesh = new THREE.Mesh(fWallGeo, wallGrazingMat);
  fWallMesh.position.set(0, height - totalHeight - wallWashHeight / 2, depth / 2 + 0.001);
  fWallMesh.renderOrder = 3;
  fWallMesh.userData.isWallGrazing = true;
  group.add(fWallMesh);

  // Back Wall Grazing Scatter Plane (downward wash on back wall face)
  const bWallGeo = new THREE.PlaneGeometry(width, wallWashHeight);
  bWallGeo.rotateY(Math.PI);
  const bWallMesh = new THREE.Mesh(bWallGeo, wallGrazingMat);
  bWallMesh.position.set(0, height - totalHeight - wallWashHeight / 2, -(depth / 2 + 0.001));
  bWallMesh.renderOrder = 3;
  bWallMesh.userData.isWallGrazing = true;
  group.add(bWallMesh);

  // Top ceiling slab backing to ensure seamless solid top
  const topCapGeom = new THREE.BoxGeometry(width, totalHeight * 0.12, depth + protrusion * 2);
  const topCap = new THREE.Mesh(topCapGeom, mouldingMat);
  topCap.position.set(0, height - (totalHeight * 0.12) / 2, 0);
  topCap.castShadow = true;
  topCap.receiveShadow = true;
  group.add(topCap);

  return group;
}

// Alias for backwards compatibility
export const createCoveLight = createUpperMoulding;

/**
 * Geometric-similarity scale factor: how big this wall is relative to the
 * size the detail proportions were designed at. Uses a geometric mean of
 * the width- and height-ratios so both dimensions matter, but a wall that's
 * short-and-wide or tall-and-narrow doesn't get absurdly over/under scaled.
 */
export function computeScaleFactor(width, height) {
  return Math.sqrt((width / REF_WIDTH) * (height / REF_HEIGHT));
}

function build(group, opts) {
  const {
    width = 3,
    height = 2.8,
    depth = 0.15,
    wallColor = 0xede7da,
    hasSkirting = true,
    skirtingColor = 0xf6f3ec,
    hasUpperMoulding = true,
    mouldingColor = 0xf6f3ea,
    tileSize = 1.0,
  } = opts;

  // Clear any previous contents (used by resize()).
  while (group.children.length) {
    const child = group.children.pop();
    child.traverse?.((o) => {
      o.geometry?.dispose?.();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.());
      }
    });
  }

  group.name = 'wall';

  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.78,      // painted plaster: slightly less rough than bare concrete
    metalness: 0.0,
    // envMapIntensity kept at default (1.0) to catch subtle ambient reflections
  });

  const wallGeo = new THREE.BoxGeometry(width, height, depth);
  const wallMesh = new THREE.Mesh(wallGeo, wallMat);
  wallMesh.position.set(0, height / 2, 0);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  addEdges(wallMesh, 0x1a1a1a, 0.06); // slightly softer edge lines
  group.add(wallMesh);

  const scaleFactor = computeScaleFactor(width, height);

  if (hasSkirting) {
    group.add(createSkirting({ width, depth, height, skirtingColor, scaleFactor }));
  }

  if (hasUpperMoulding || opts.hasCoveLight) {
    group.add(createUpperMoulding({ width, depth, height, mouldingColor, scaleFactor }));
  }

  // ---------------------------------------------------------------------
  // INTERACTION: custom repeatable texture support
  // ---------------------------------------------------------------------
  function applyTexture(urlOrTexture) {
    const onReady = (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(Math.max(1, width / tileSize), Math.max(1, height / tileSize));
      wallMat.map = tex;
      wallMat.color.set(0xffffff);
      wallMat.needsUpdate = true;
    };
    if (typeof urlOrTexture === 'string') {
      textureLoader.load(urlOrTexture, onReady);
    } else if (urlOrTexture && urlOrTexture.isTexture) {
      onReady(urlOrTexture);
    }
  }

  function resetTexture() {
    wallMat.map = null;
    wallMat.color.set(wallColor);
    wallMat.needsUpdate = true;
  }

  function resize(newOpts) {
    const merged = { ...opts, ...newOpts };
    build(group, merged);
  }

  group.userData = {
    type: 'wall',
    width,
    height,
    depth,
    hasSkirting,
    isInteractable: true,
    supportsTexture: true,
    applyTexture,
    resetTexture,
    resize,
    options: opts,
  };
}

/**
 * @param {Object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {number} opts.depth
 * @param {number} opts.wallColor
 * @param {boolean} opts.hasSkirting
 * @param {number} opts.skirtingColor
 * @param {number} opts.tileSize  real-world meters per texture tile when a
 *        custom texture is applied (controls repeat density)
 * @returns {THREE.Group}
 */
export function createWall(opts = {}) {
  const group = new THREE.Group();
  build(group, opts);
  return group;
}

export default createWall;
