/**
 * door.js
 * -------------------------------------------------------------------------
 * Realistic interior DOOR ASSEMBLY & FRAME for Three.js.
 *
 * Full-thickness door frame (inner jambs + outer casing architraves) and
 * swinging door leaf panel with brass lever handles.
 *
 * Features:
 *   1. Full-depth inner jambs (left, right, top) covering the wall thickness
 *      so no bare wall opening is visible inside the doorway.
 *   2. Front and back 3-sided casing architrave trim.
 *   3. Door leaf panel sized to fit cleanly inside the frame.
 *   4. Brass lever handles with backplates on front and back.
 *   5. Texture synchronization: both door leaf and frame share door textures.
 *   6. Upper wall block & upper ceiling moulding above the door.
 * -------------------------------------------------------------------------
 */

import * as THREE from 'three';

/**
 * Creates an extruded 2D shape from polygon points with optional padding.
 */
export function polyToShape(pts, scale, cx, cy, padding = 0.020) {
  if (!pts || pts.length === 0) return new THREE.Shape();

  let renderPts = pts;
  if (padding > 0 && pts.length >= 3) {
    const n = pts.length;
    let area = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
    }
    const isCCW = area > 0;

    const offsetPts = [];
    for (let i = 0; i < n; i++) {
      const prev = (i - 1 + n) % n;
      const next = (i + 1) % n;

      const dx1 = pts[i][0] - pts[prev][0];
      const dy1 = pts[i][1] - pts[prev][1];
      const len1 = Math.hypot(dx1, dy1) || 1;

      const dx2 = pts[next][0] - pts[i][0];
      const dy2 = pts[next][1] - pts[i][1];
      const len2 = Math.hypot(dx2, dy2) || 1;

      const sign = isCCW ? 1 : -1;
      const nx1 = (dy1 / len1) * sign;
      const ny1 = (-dx1 / len1) * sign;
      const nx2 = (dy2 / len2) * sign;
      const ny2 = (-dx2 / len2) * sign;

      let mx = nx1 + nx2;
      let my = ny1 + ny2;
      const mlen = Math.hypot(mx, my);
      if (mlen > 0.0001) { mx /= mlen; my /= mlen; } else { mx = nx1; my = ny1; }

      const pDelta = padding / scale;
      offsetPts.push([pts[i][0] + mx * pDelta, pts[i][1] + my * pDelta]);
    }
    renderPts = offsetPts;
  }

  const shape = new THREE.Shape();
  shape.moveTo((renderPts[0][0] - cx) * scale, (renderPts[0][1] - cy) * scale);
  for (let i = 1; i < renderPts.length; i++) {
    shape.lineTo((renderPts[i][0] - cx) * scale, (renderPts[i][1] - cy) * scale);
  }
  shape.closePath();
  return shape;
}

/**
 * Creates upper ceiling moulding / crown trim for the upper door wall.
 */
let _cachedDoorCeilingScatterTex = null;
function getDoorCeilingScatterTexture() {
  if (_cachedDoorCeilingScatterTex) return _cachedDoorCeilingScatterTex;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
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
  _cachedDoorCeilingScatterTex = texture;
  return texture;
}

let _cachedDoorWallGrazingTex = null;
function getDoorWallGrazingTexture() {
  if (_cachedDoorWallGrazingTex) return _cachedDoorWallGrazingTex;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
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
  _cachedDoorWallGrazingTex = texture;
  return texture;
}

function buildDoorCeilingScatterRing(pts, miterNormals, pInner, pOuter, scale, cx, cy, y, material) {
  const n = pts.length;
  if (n < 3) return null;
  const positions = [];
  const uvs = [];
  const indices = [];
  const innerDelta = pInner / scale;
  const outerDelta = pOuter / scale;

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const inX1 = (pts[i][0] + miterNormals[i][0] * innerDelta - cx) * scale;
    const inZ1 = -(pts[i][1] + miterNormals[i][1] * innerDelta - cy) * scale;
    const outX1 = (pts[i][0] + miterNormals[i][0] * outerDelta - cx) * scale;
    const outZ1 = -(pts[i][1] + miterNormals[i][1] * outerDelta - cy) * scale;

    const inX2 = (pts[next][0] + miterNormals[next][0] * innerDelta - cx) * scale;
    const inZ2 = -(pts[next][1] + miterNormals[next][1] * innerDelta - cy) * scale;
    const outX2 = (pts[next][0] + miterNormals[next][0] * outerDelta - cx) * scale;
    const outZ2 = -(pts[next][1] + miterNormals[next][1] * outerDelta - cy) * scale;

    const baseIdx = positions.length / 3;
    positions.push(inX1, y, inZ1); uvs.push(0.0, 0.5);
    positions.push(outX1, y, outZ1); uvs.push(1.0, 0.5);
    positions.push(inX2, y, inZ2); uvs.push(0.0, 0.5);
    positions.push(outX2, y, outZ2); uvs.push(1.0, 0.5);

    indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
    indices.push(baseIdx + 2, baseIdx + 1, baseIdx + 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 3;

  return mesh;
}

function buildDoorWallGrazingMesh(pts, miterNormals, pOffset, scale, cx, cy, yTop, yBottom, material) {
  const n = pts.length;
  if (n < 3) return null;
  const positions = [];
  const uvs = [];
  const indices = [];
  const delta = pOffset / scale;

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const x1 = (pts[i][0] + miterNormals[i][0] * delta - cx) * scale;
    const z1 = -(pts[i][1] + miterNormals[i][1] * delta - cy) * scale;
    const x2 = (pts[next][0] + miterNormals[next][0] * delta - cx) * scale;
    const z2 = -(pts[next][1] + miterNormals[next][1] * delta - cy) * scale;

    const baseIdx = positions.length / 3;
    positions.push(x1, yTop, z1); uvs.push(0.5, 0.0);
    positions.push(x1, yBottom, z1); uvs.push(0.5, 1.0);
    positions.push(x2, yTop, z2); uvs.push(0.5, 0.0);
    positions.push(x2, yBottom, z2); uvs.push(0.5, 1.0);

    indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
    indices.push(baseIdx + 2, baseIdx + 1, baseIdx + 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 3;

  return mesh;
}

export function createUpperDoorSkirting(pts, scale, cx, cy, wallHeight, skirtingHeight = 0.080, skirtingProtrusion = 0.030) {
  if (!pts || pts.length < 3) return null;

  const group = new THREE.Group();
  group.name = 'doorUpperLightStripAssembly';

  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  const isCCW = area > 0;

  // Calculate mitered normal unit vectors for each vertex
  const miterNormals = [];
  for (let i = 0; i < n; i++) {
    const prev = (i - 1 + n) % n;
    const next = (i + 1) % n;

    const dx1 = pts[i][0] - pts[prev][0];
    const dy1 = pts[i][1] - pts[prev][1];
    const len1 = Math.hypot(dx1, dy1) || 1;

    const dx2 = pts[next][0] - pts[i][0];
    const dy2 = pts[next][1] - pts[i][1];
    const len2 = Math.hypot(dx2, dy2) || 1;

    const sign = isCCW ? 1 : -1;
    const nx1 = (dy1 / len1) * sign;
    const ny1 = (-dx1 / len1) * sign;

    const nx2 = (dy2 / len2) * sign;
    const ny2 = (-dx2 / len2) * sign;

    let mx = nx1 + nx2;
    let my = ny1 + ny2;
    const mlen = Math.hypot(mx, my);
    if (mlen > 0.0001) {
      mx /= mlen;
      my /= mlen;
    } else {
      mx = nx1;
      my = ny1;
    }
    miterNormals.push([mx, my]);
  }

  // 1. Clean architectural off-white moulding trim
  const mouldingMat = new THREE.MeshStandardMaterial({
    color: 0xf6f3ea,
    roughness: 0.32,
    metalness: 0.0,
  });

  // 2. Thin translucent glass diffuser lens material with warm interior transmission
  const glassDiffuserMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xffe6c2,
    emissiveIntensity: 0.85,
    roughness: 0.12,
    metalness: 0.02,
    transmission: 0.65,
    ior: 1.52,
    transparent: true,
    opacity: 0.88,
  });

  // 3. Simple warm white LED light core
  const ledCoreMat = new THREE.MeshBasicMaterial({
    color: 0xfffaee,
    toneMapped: false,
  });

  // 4. Subtle warm glow halo
  const glowHaloMat = new THREE.MeshBasicMaterial({
    color: 0xffdfaa,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });

  // 5. Photometric Ceiling Light Scatter Wash Material
  const ceilingScatterMat = new THREE.MeshBasicMaterial({
    map: getDoorCeilingScatterTexture(),
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  // 6. Photometric Wall Grazing Scatter Wash Material
  const wallGrazingMat = new THREE.MeshBasicMaterial({
    map: getDoorWallGrazingTexture(),
    transparent: true,
    opacity: 0.68,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  // Architectural profile with integrated thin glass light channel
  const profileTiers = [
    { pRatio: 1.00, hRatio: 0.26, type: 'moulding', mat: mouldingMat },
    { pRatio: 0.90, hRatio: 0.22, type: 'glass_light', mat: glassDiffuserMat },
    { pRatio: 0.65, hRatio: 0.38, type: 'moulding', mat: mouldingMat },
    { pRatio: 0.30, hRatio: 0.14, type: 'moulding', mat: mouldingMat },
  ];

  let currentYOffset = 0;
  for (let t = 0; t < profileTiers.length; t++) {
    const tier = profileTiers[t];
    const tierH = skirtingHeight * tier.hRatio;
    const tierP = skirtingProtrusion * tier.pRatio;
    const pDelta = tierP / scale;

    const tierOffsetPts = pts.map(([px, py], i) => [
      px + miterNormals[i][0] * pDelta,
      py + miterNormals[i][1] * pDelta
    ]);

    const tierShape = polyToShape(tierOffsetPts, scale, cx, cy);
    tierShape.holes.push(polyToShape(pts, scale, cx, cy));

    const tierGeom = new THREE.ExtrudeGeometry(tierShape, { depth: tierH, bevelEnabled: false });
    tierGeom.rotateX(-Math.PI / 2);
    const tierY = wallHeight - currentYOffset - tierH;
    tierGeom.translate(0, tierY, 0);

    const tierMesh = new THREE.Mesh(tierGeom, tier.mat);
    tierMesh.castShadow = (tier.type === 'moulding');
    tierMesh.receiveShadow = true;
    tierMesh.userData.isUpperSkirting = true;
    if (tier.type === 'glass_light') {
      tierMesh.userData.isCoveGlass = true;
    }
    group.add(tierMesh);

    // If this is the glass light tier, embed the simple warm LED light strip inside
    if (tier.type === 'glass_light') {
      const coreP = tierP * 0.96;
      const coreDelta = coreP / scale;
      const coreOffsetPts = pts.map(([px, py], i) => [
        px + miterNormals[i][0] * coreDelta,
        py + miterNormals[i][1] * coreDelta
      ]);
      const coreShape = polyToShape(coreOffsetPts, scale, cx, cy);
      coreShape.holes.push(polyToShape(pts, scale, cx, cy));

      const coreH = tierH * 0.45;
      const coreGeom = new THREE.ExtrudeGeometry(coreShape, { depth: coreH, bevelEnabled: false });
      coreGeom.rotateX(-Math.PI / 2);
      coreGeom.translate(0, tierY + (tierH - coreH) / 2, 0);

      const coreMesh = new THREE.Mesh(coreGeom, ledCoreMat);
      coreMesh.userData.isCoveCore = true;
      group.add(coreMesh);

      // Subtle warm glow halo
      const glowP = tierP * 1.05;
      const glowDelta = glowP / scale;
      const glowOffsetPts = pts.map(([px, py], i) => [
        px + miterNormals[i][0] * glowDelta,
        py + miterNormals[i][1] * glowDelta
      ]);
      const glowShape = polyToShape(glowOffsetPts, scale, cx, cy);
      glowShape.holes.push(polyToShape(pts, scale, cx, cy));

      const glowH = tierH * 1.12;
      const glowGeom = new THREE.ExtrudeGeometry(glowShape, { depth: glowH, bevelEnabled: false });
      glowGeom.rotateX(-Math.PI / 2);
      glowGeom.translate(0, tierY - (glowH - tierH) / 2, 0);

      const glowMesh = new THREE.Mesh(glowGeom, glowHaloMat);
      glowMesh.userData.isCoveGlow = true;
      group.add(glowMesh);
    }

    currentYOffset += tierH;
  }

  // 7. Photorealistic Light Scattering Wash onto the Ceiling Underside
  const ceilingScatterSpread = Math.max(0.12, skirtingProtrusion * 2.8);
  const ceilingScatterMesh = buildDoorCeilingScatterRing(
    pts,
    miterNormals,
    skirtingProtrusion * 0.95,
    skirtingProtrusion + ceilingScatterSpread,
    scale,
    cx,
    cy,
    wallHeight - 0.0005,
    ceilingScatterMat
  );
  if (ceilingScatterMesh) {
    ceilingScatterMesh.userData.isCeilingScatter = true;
    group.add(ceilingScatterMesh);
  }

  // 8. Photorealistic Light Scattering Wash down the Upper Wall Face
  const wallWashHeight = Math.max(0.18, skirtingHeight * 2.4);
  const wallGrazingMesh = buildDoorWallGrazingMesh(
    pts,
    miterNormals,
    skirtingProtrusion * 0.32,
    scale,
    cx,
    cy,
    wallHeight - skirtingHeight,
    wallHeight - skirtingHeight - wallWashHeight,
    wallGrazingMat
  );
  if (wallGrazingMesh) {
    wallGrazingMesh.userData.isWallGrazing = true;
    group.add(wallGrazingMesh);
  }

  return group;
}

/**
 * Creates a complete 3D Door Mesh from polygon data with realistic full-depth
 * frame lining, outer casing trim, swinging door leaf, and lever handles.
 */
export function createDoorMesh(poly, scale, cx, cy, doorHeight, wallHeight, edgeAngleDeg, options = {}) {
  const pts = poly.outer;
  if (!pts || pts.length < 3) return new THREE.Group();

  const group = new THREE.Group();
  const shape = polyToShape(pts, scale, cx, cy);

  const wallMat = options.wallMat || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  const doorMat = options.doorMat || new THREE.MeshStandardMaterial({ color: 0xede9e1, roughness: 0.50 });
  const edgeMat = options.edgeMat || new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.78 });
  const activeDoorTexture = options.activeDoorTexture || null;

  // 1. UPPER WALL BLOCK (fills wall opening above door height up to ceiling)
  const upperHeight = wallHeight - doorHeight;
  if (upperHeight > 0.001) {
    const upperGeom = new THREE.ExtrudeGeometry(shape, { depth: upperHeight, bevelEnabled: false });
    upperGeom.rotateX(-Math.PI / 2);
    upperGeom.translate(0, doorHeight, 0);

    const upperMesh = new THREE.Mesh(upperGeom, wallMat);
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    upperMesh.userData.isWall = true;
    group.add(upperMesh);

    const upperSkirting = createUpperDoorSkirting(pts, scale, cx, cy, wallHeight, 0.080, 0.030);
    if (upperSkirting) {
      group.add(upperSkirting);
    }
  }

  // Calculate doorway bounding box & orientation
  let minWX = Infinity, maxWX = -Infinity, minWZ = Infinity, maxWZ = -Infinity;
  for (const [px, py] of pts) {
    const wx = (px - cx) * scale;
    const wz = -(py - cy) * scale;
    if (wx < minWX) minWX = wx;
    if (wx > maxWX) maxWX = wx;
    if (wz < minWZ) minWZ = wz;
    if (wz > maxWZ) maxWZ = wz;
  }

  const doorCenterX = (minWX + maxWX) / 2;
  const doorCenterZ = (minWZ + maxWZ) / 2;
  const sizeX = maxWX - minWX;
  const sizeZ = maxWZ - minWZ;
  const isXMajor = sizeX >= sizeZ;

  const PADDING = 0.020;
  // Exact wall thickness and doorway span matching the surrounding wall geometry
  const wallThickness = isXMajor ? (sizeZ + PADDING * 2) : (sizeX + PADDING * 2);
  const openingSpan   = isXMajor ? (sizeX + PADDING * 2) : (sizeZ + PADDING * 2);

  // Proportional jamb thickness (up to 3.5cm, scaled down for narrow doors)
  const jambT = Math.min(0.035, openingSpan * 0.05);

  // Door leaf thickness automatically matches and scales with wall thickness
  const doorLeafThickness = Math.min(0.038, Math.max(0.018, wallThickness * 0.38));

  // The door frame depth across the wall is EXACTLY equal to the wall thickness
  const wallDepth = wallThickness;

  const doorStart = isXMajor ? (minWX - PADDING) : (minWZ - PADDING);
  const doorEnd   = isXMajor ? (maxWX + PADDING) : (maxWZ + PADDING);

  // 2. FULL-DEPTH 3D DOOR FRAME (Single clean frame matching exact wall thickness)
  // Shared door frame material matching door texture
  const frameMat = doorMat.clone();
  if (activeDoorTexture) {
    frameMat.map = activeDoorTexture.clone();
    frameMat.map.wrapS = THREE.RepeatWrapping;
    frameMat.map.wrapT = THREE.RepeatWrapping;
    frameMat.map.repeat.set(2, 2);
    frameMat.needsUpdate = true;
  }

  const frameGroup = new THREE.Group();

  function createFramePart(w, h, d, px, py, pz) {
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, frameMat);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isDoorFrame = true;

    const edges = new THREE.EdgesGeometry(geom, 15);
    mesh.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
      color: 0x1a1a1a, transparent: true, opacity: 0.12,
    })));
    return mesh;
  }

  if (isXMajor) {
    // Single clean inner jamb frame matching exact wall thickness
    // Left side jamb
    frameGroup.add(createFramePart(jambT, doorHeight, wallDepth, doorStart + jambT / 2, doorHeight / 2, doorCenterZ));
    // Right side jamb
    frameGroup.add(createFramePart(jambT, doorHeight, wallDepth, doorEnd - jambT / 2, doorHeight / 2, doorCenterZ));
    // Top header jamb
    frameGroup.add(createFramePart(openingSpan, jambT, wallDepth, doorCenterX, doorHeight - jambT / 2, doorCenterZ));
  } else {
    // Single clean inner jamb frame matching exact wall thickness
    // Side jamb 1
    frameGroup.add(createFramePart(wallDepth, doorHeight, jambT, doorCenterX, doorHeight / 2, doorStart + jambT / 2));
    // Side jamb 2
    frameGroup.add(createFramePart(wallDepth, doorHeight, jambT, doorCenterX, doorHeight / 2, doorEnd - jambT / 2));
    // Top header jamb
    frameGroup.add(createFramePart(wallDepth, jambT, openingSpan, doorCenterX, doorHeight - jambT / 2, doorCenterZ));
  }
  group.add(frameGroup);

  // 3. DOOR HINGE PIVOT & SWINGING DOOR LEAF
  // Position hinge pivot inside the jamb reveal
  const pivotX = isXMajor ? (doorStart + jambT) : doorCenterX;
  const pivotZ = isXMajor ? doorCenterZ : (doorStart + jambT);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(pivotX, 0, pivotZ);
  group.add(doorPivot);

  // Inner opening dimensions inside the jambs
  const leafWidth = openingSpan - jambT * 2;
  const leafHeight = doorHeight - jambT;

  const leafGeom = new THREE.BoxGeometry(
    isXMajor ? leafWidth : doorLeafThickness,
    leafHeight,
    isXMajor ? doorLeafThickness : leafWidth
  );

  const doorLeafMat = doorMat.clone();
  if (activeDoorTexture) {
    doorLeafMat.map = activeDoorTexture.clone();
    doorLeafMat.map.wrapS = THREE.RepeatWrapping;
    doorLeafMat.map.wrapT = THREE.RepeatWrapping;
    doorLeafMat.map.repeat.set(2, 2);
    doorLeafMat.needsUpdate = true;
  }

  const leafMesh = new THREE.Mesh(leafGeom, doorLeafMat);
  leafMesh.castShadow = true;
  leafMesh.receiveShadow = true;
  leafMesh.userData.isDoorLeaf = true;

  if (isXMajor) {
    leafMesh.position.set(leafWidth / 2, leafHeight / 2, 0);
  } else {
    leafMesh.position.set(0, leafHeight / 2, leafWidth / 2);
  }

  const leafEdges = new THREE.EdgesGeometry(leafGeom, edgeAngleDeg);
  leafMesh.add(new THREE.LineSegments(leafEdges, edgeMat));
  doorPivot.add(leafMesh);

  // 4. BRASS LEVER HANDLES (Front & Back)
  const handleY = doorHeight * 0.45;
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xc9a227,   // brass / warm metallic
    roughness: 0.25,
    metalness: 0.85,
  });

  function createLeverHandle() {
    const handleGroup = new THREE.Group();

    const plateGeom = new THREE.BoxGeometry(0.028, 0.095, 0.008);
    const plate = new THREE.Mesh(plateGeom, handleMat);
    handleGroup.add(plate);

    const stemGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.018, 12);
    stemGeom.rotateX(Math.PI / 2);
    const stem = new THREE.Mesh(stemGeom, handleMat);
    stem.position.set(0, 0.010, 0.012);
    handleGroup.add(stem);

    const leverGeom = new THREE.CylinderGeometry(0.0055, 0.0055, 0.062, 12);
    leverGeom.rotateZ(Math.PI / 2);
    const lever = new THREE.Mesh(leverGeom, handleMat);
    lever.position.set(0.025, 0.010, 0.020);
    handleGroup.add(lever);

    return handleGroup;
  }

  if (isXMajor) {
    const handleOffsetX = leafWidth * 0.82;
    const offsetZ = doorLeafThickness / 2 + 0.006;

    const handleFront = createLeverHandle();
    handleFront.position.set(handleOffsetX, handleY, offsetZ);
    doorPivot.add(handleFront);

    const handleBack = createLeverHandle();
    handleBack.rotation.y = Math.PI;
    handleBack.position.set(handleOffsetX, handleY, -offsetZ);
    doorPivot.add(handleBack);
  } else {
    const handleOffsetZ = leafWidth * 0.82;
    const offsetX = doorLeafThickness / 2 + 0.006;

    const handleFront = createLeverHandle();
    handleFront.rotation.y = Math.PI / 2;
    handleFront.position.set(offsetX, handleY, handleOffsetZ);
    doorPivot.add(handleFront);

    const handleBack = createLeverHandle();
    handleBack.rotation.y = -Math.PI / 2;
    handleBack.position.set(-offsetX, handleY, handleOffsetZ);
    doorPivot.add(handleBack);
  }

  // Interactive door opening API
  group.userData = {
    isDoor: true,
    isOpen: false,
    currentAngle: 0,
    targetAngle: 0,
    pivot: doorPivot,
    isXMajor: isXMajor,
    pivotPos: new THREE.Vector3(pivotX, 0, pivotZ),
    center: new THREE.Vector3(doorCenterX, doorHeight * 0.5, doorCenterZ),
    toggle(camPos) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        const pos = camPos || camera.position;
        if (this.isXMajor) {
          const dz = pos.z - this.center.z;
          this.targetAngle = dz >= 0 ? 1.4 : -1.4;
        } else {
          const dx = pos.x - this.center.x;
          this.targetAngle = dx >= 0 ? -1.4 : 1.4;
        }
      } else {
        this.targetAngle = 0;
      }
    }
  };

  // Transparent doorway interaction volume — ensures the eye line detects the doorway whether open or closed
  const doorwayTriggerGeom = new THREE.BoxGeometry(
    isXMajor ? openingSpan : (doorLeafThickness * 2.2),
    doorHeight,
    isXMajor ? (doorLeafThickness * 2.2) : openingSpan
  );
  const doorwayTriggerMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const doorwayTrigger = new THREE.Mesh(doorwayTriggerGeom, doorwayTriggerMat);
  doorwayTrigger.position.set(doorCenterX, doorHeight * 0.5, doorCenterZ);
  doorwayTrigger.userData.isDoorTrigger = true;
  group.add(doorwayTrigger);

  return group;
}

export default createDoorMesh;
