/**
 * coveLighting.js
 * -------------------------------------------------------------------------
 * Dynamic cove ceiling LED strip lighting for Three.js — CONTINUOUS, SMOOTH & ELEVATED.
 *
 * Renders warm glowing LED strips along continuous room/building loops with
 * ultra-smooth rounded fillet corners. Connected walls, doors, and windows
 * form unified continuous loops, and the LED strip curves smoothly at every corner.
 *
 * Coordinate convention (matches the project's world-unit system):
 *   - Units are ~0.001–8 world units.
 *   - Y = up, X/Z = horizontal plane.
 * -------------------------------------------------------------------------
 */

import * as THREE from 'three';

// =========================================================================
// 2D polygon cleaning & inset helpers
// =========================================================================

/**
 * Removes duplicate vertices and collinear points along straight wall segments.
 * This guarantees that only TRUE corners get rounded, preventing bumpy/jagged edges along walls.
 */
function cleanPolygon(pts, distThresh = 0.008, angleThreshDeg = 10) {
  if (!pts || pts.length < 3) return pts ? pts.slice() : [];

  // 1. Remove consecutive duplicates
  const cleaned = [];
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const prev = cleaned[cleaned.length - 1];
    if (!prev || Math.hypot(cur.x - prev.x, cur.y - prev.y) > distThresh) {
      cleaned.push({ x: cur.x, y: cur.y });
    }
  }
  // Check closing point vs first point
  if (cleaned.length > 2) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) <= distThresh) {
      cleaned.pop();
    }
  }

  if (cleaned.length < 3) return pts.slice();

  // 2. Remove collinear / near-straight points (angle deviation < angleThreshDeg)
  const radThresh = (angleThreshDeg * Math.PI) / 180;
  const result = [];
  const n = cleaned.length;

  for (let i = 0; i < n; i++) {
    const prev = cleaned[(i - 1 + n) % n];
    const cur = cleaned[i];
    const next = cleaned[(i + 1) % n];

    const v1 = { x: cur.x - prev.x, y: cur.y - prev.y };
    const v2 = { x: next.x - cur.x, y: next.y - cur.y };

    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);

    if (len1 < 1e-6 || len2 < 1e-6) continue;

    const cross = (v1.x * v2.y - v1.y * v2.x) / (len1 * len2);
    const angle = Math.asin(Math.min(1, Math.max(-1, Math.abs(cross))));
    const dot = (v1.x * v2.x + v1.y * v2.y) / (len1 * len2);

    // Skip point if it's nearly straight
    if (angle < radThresh && dot > 0) {
      continue;
    }

    result.push(cur);
  }

  return result.length >= 3 ? result : cleaned;
}

function lineIntersect(p1, p2, p3, p4) {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-9) return { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  return { x: p1.x + d1x * t, y: p1.y + d1y * t };
}

function insetPolygon(rawPts, dist) {
  const pts = cleanPolygon(rawPts);
  const n = pts.length;
  if (n < 3) return pts.slice();

  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    area += a.x * b.y - b.x * a.y;
  }
  const sign = area > 0 ? 1 : -1;

  const offsetLines = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (dy / len) * sign;
    const ny = (-dx / len) * sign;
    offsetLines.push({
      a: { x: a.x + nx * dist, y: a.y + ny * dist },
      b: { x: b.x + nx * dist, y: b.y + ny * dist },
    });
  }

  const out = [];
  for (let i = 0; i < n; i++) {
    const l1 = offsetLines[(i - 1 + n) % n];
    const l2 = offsetLines[i];
    const raw = lineIntersect(l1.a, l1.b, l2.a, l2.b);

    const orig = pts[i];
    const vx = raw.x - orig.x, vy = raw.y - orig.y;
    const spike = Math.hypot(vx, vy);
    const limit = Math.abs(dist) * 3.5 + 0.001;
    if (spike > limit) {
      const k = limit / spike;
      out.push({ x: orig.x + vx * k, y: orig.y + vy * k });
    } else {
      out.push(raw);
    }
  }
  return cleanPolygon(out);
}

/**
 * High-resolution corner fillet generator for silky smooth rounded corners.
 */
function roundPolygon(rawPts, radius, segs = 20) {
  const pts = cleanPolygon(rawPts);
  const n = pts.length;
  if (radius <= 0.0001 || n < 3) return pts.slice();
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];

    const d1 = { x: cur.x - prev.x, y: cur.y - prev.y };
    const d2 = { x: next.x - cur.x, y: next.y - cur.y };
    const len1 = Math.hypot(d1.x, d1.y) || 1;
    const len2 = Math.hypot(d2.x, d2.y) || 1;
    const cut = Math.min(radius, len1 * 0.45, len2 * 0.45);

    const p1 = { x: cur.x - (d1.x / len1) * cut, y: cur.y - (d1.y / len1) * cut };
    const p2 = { x: cur.x + (d2.x / len2) * cut, y: cur.y + (d2.y / len2) * cut };

    const curve = new THREE.QuadraticBezierCurve(
      new THREE.Vector2(p1.x, p1.y),
      new THREE.Vector2(cur.x, cur.y),
      new THREE.Vector2(p2.x, p2.y)
    );
    const arcPts = curve.getPoints(segs);
    for (let k = 0; k < arcPts.length; k++) {
      out.push({ x: arcPts[k].x, y: arcPts[k].y });
    }
  }
  return out;
}

function toV2(pts) {
  return pts.map(p => new THREE.Vector2(p.x, p.y));
}

// =========================================================================
// Smooth curve path & tube builder
// =========================================================================

function buildFilletCurvePath(polyPts, y, radius) {
  const pts = cleanPolygon(polyPts);
  const n = pts.length;
  if (n < 3) return new THREE.CurvePath();

  const fillets = pts.map((cur, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const d1 = { x: cur.x - prev.x, y: cur.y - prev.y };
    const d2 = { x: next.x - cur.x, y: next.y - cur.y };
    const len1 = Math.hypot(d1.x, d1.y) || 1;
    const len2 = Math.hypot(d2.x, d2.y) || 1;
    const cut = Math.min(radius, len1 * 0.45, len2 * 0.45);
    return {
      p1: { x: cur.x - (d1.x / len1) * cut, y: cur.y - (d1.y / len1) * cut },
      corner: cur,
      p2: { x: cur.x + (d2.x / len2) * cut, y: cur.y + (d2.y / len2) * cut },
    };
  });

  const path = new THREE.CurvePath();
  for (let i = 0; i < n; i++) {
    const cur = fillets[i];
    const nxt = fillets[(i + 1) % n];
    path.add(new THREE.LineCurve3(
      new THREE.Vector3(cur.p2.x, y, cur.p2.y),
      new THREE.Vector3(nxt.p1.x, y, nxt.p1.y)
    ));
    path.add(new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(nxt.p1.x, y, nxt.p1.y),
      new THREE.Vector3(nxt.corner.x, y, nxt.corner.y),
      new THREE.Vector3(nxt.p2.x, y, nxt.p2.y)
    ));
  }
  return path;
}

function buildFlatTube(pts, radius, radialSegments = 8, material) {
  const n = pts.length;
  if (n < 3) return null;
  const worldUp = new THREE.Vector3(0, 1, 0);

  const rings = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
    let right = new THREE.Vector3().crossVectors(tangent, worldUp);
    if (right.lengthSq() < 1e-8) right.set(1, 0, 0); else right.normalize();
    const up = new THREE.Vector3().crossVectors(right, tangent).normalize();

    const ring = [];
    for (let j = 0; j < radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const cosT = Math.cos(theta), sinT = Math.sin(theta);
      ring.push(new THREE.Vector3(
        pts[i].x + (right.x * cosT + up.x * sinT) * radius,
        pts[i].y + (right.y * cosT + up.y * sinT) * radius,
        pts[i].z + (right.z * cosT + up.z * sinT) * radius
      ));
    }
    rings.push(ring);
  }

  const positions = [];
  for (const ring of rings) for (const v of ring) positions.push(v.x, v.y, v.z);

  const indices = [];
  for (let i = 0; i < n; i++) {
    const iNext = (i + 1) % n;
    for (let j = 0; j < radialSegments; j++) {
      const jNext = (j + 1) % radialSegments;
      const a = i * radialSegments + j;
      const b = iNext * radialSegments + j;
      const c = iNext * radialSegments + jNext;
      const d = i * radialSegments + jNext;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

/**
 * Continuous volumetric emissive lighting helper.
 * Uses MeshBasicMaterial 3D tubes and sheaths for 100% uniform light emission
 * without adding dynamic WebGL light uniforms (preventing MAX_FRAGMENT_UNIFORM_VECTORS errors).
 */
function placeLightsUniformlyAlongPoints(pts, color, totalIntensity, throwDist, group, yOffset) {
  // 0 light uniforms needed: volumetric emissive tubes handle 100% of visual illumination smoothly
}

function buildBandMesh(outerLoop, innerLoop, y, material) {
  if (outerLoop.length < 3 || innerLoop.length < 3) return null;
  try {
    const shape = new THREE.Shape(toV2(outerLoop));
    shape.holes.push(new THREE.Path(toV2(innerLoop)));
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, y, 0);
    return new THREE.Mesh(geo, material);
  } catch (e) {
    return null;
  }
}

function buildRiser(loop, yTop, yBottom, material) {
  const n = loop.length;
  if (n < 3) return null;
  const verts = [];
  for (let i = 0; i < n; i++) {
    const a = loop[i], b = loop[(i + 1) % n];
    const A = [a.x, yTop, a.y], B = [a.x, yBottom, a.y];
    const C = [b.x, yTop, b.y], D = [b.x, yBottom, b.y];
    verts.push(...A, ...B, ...C, ...B, ...D, ...C);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

// =========================================================================
// Cove Ring Builder per Unified Continuous Polygon Loop
// =========================================================================

/**
 * Build a single cove ring on one side of the polygon.
 * @param {'inside'|'outside'} side — 'inside' insets the channel toward the
 *        polygon interior, 'outside' outsets it away from the polygon.
 */
function _buildCoveRingForPolygonSide(polygon, options, group, materials, addPointLights, side) {
  const cleanedPoly = cleanPolygon(polygon);
  if (!cleanedPoly || cleanedPoly.length < 3) return;

  const o = options;
  const H = o.wallHeight;

  let perimeter = 0;
  for (let i = 0; i < cleanedPoly.length; i++) {
    const a = cleanedPoly[i];
    const b = cleanedPoly[(i + 1) % cleanedPoly.length];
    perimeter += Math.hypot(b.x - a.x, b.y - a.y);
  }
  if (perimeter < 0.2) return; // skip tiny noise artifacts

  // Sign controls direction: positive = inset (inside), negative = outset (outside)
  const sign = side === 'outside' ? -1 : 1;

  const d1 = o.gapFromWall * sign;
  const d2 = (o.gapFromWall + o.channelWidth) * sign;
  const dMid = (o.gapFromWall + o.channelWidth / 2) * sign;

  const outerPoly = cleanedPoly;
  const chOuter = insetPolygon(cleanedPoly, d1);
  const chInner = insetPolygon(cleanedPoly, d2);

  // Large corner radius for smooth rounded corner curves
  const cornerR = Math.max(0.04, o.cornerRadius);
  const outerR = roundPolygon(outerPoly, Math.max(0.01, cornerR - Math.abs(o.gapFromWall)), o.cornerSegments);
  const chOuterR = roundPolygon(chOuter, cornerR, o.cornerSegments);
  const chInnerR = roundPolygon(chInner, Math.max(0.01, cornerR - o.channelWidth), o.cornerSegments);

  // 1. Channel Band & Risers (Clean off-white architectural trim — NO dark black leakage!)
  const floorY = H - o.channelDepth * 0.70;
  const topY = H + 0.002;

  try {
    if (side === 'inside') {
      const band = buildBandMesh(outerR, chOuterR, topY, materials.ceilingBandMat);
      if (band) group.add(band);

      const channelFloor = buildBandMesh(chOuterR, chInnerR, floorY, materials.channelMat);
      if (channelFloor) group.add(channelFloor);
    } else {
      const band = buildBandMesh(chOuterR, outerR, topY, materials.ceilingBandMat);
      if (band) group.add(band);

      const channelFloor = buildBandMesh(chInnerR, chOuterR, floorY, materials.channelMat);
      if (channelFloor) group.add(channelFloor);
    }

    const riser1 = buildRiser(chOuterR, topY, floorY, materials.riserMat);
    if (riser1) group.add(riser1);

    const riser2 = buildRiser(chInnerR, topY, floorY, materials.riserMat);
    if (riser2) group.add(riser2);
  } catch (e) {
    // protect against complex self-intersecting polygon errors
  }

  // 2. UNIFORM WARM EMITTING 3D LED LIGHT STRIP (OPTIMIZED HIGH-PERFORMANCE)
  const stripY = H - 0.006;
  const midLoop = insetPolygon(cleanedPoly, dMid);
  const midCornerR = Math.max(0.02, cornerR - o.channelWidth / 2);

  try {
    const curve = buildFilletCurvePath(midLoop, stripY, midCornerR);
    const length = curve.getLength();
    // Optimized sampling frequency for smooth curves with low polygon count
    const segs = Math.min(180, Math.max(32, Math.round(length / 0.04)));
    const rawPts = curve.getSpacedPoints(segs);
    const pts = rawPts.slice(0, -1);

    if (pts.length >= 3) {
      // A. Inner Hyper-Bright Warm White Core Tube (100% continuous line)
      const coreTube = buildFlatTube(pts, o.stripThickness * 0.45, 8, materials.coreMat);
      if (coreTube) group.add(coreTube);

      // B. Main Warm Colored LED Tube Mesh (100% continuous line)
      const tube = buildFlatTube(pts, o.stripThickness, 8, materials.stripMat);
      if (tube) group.add(tube);

      // C. Subtle Warm Glow Sheaths — soft halo like real LED strips
      //    (reduced size and opacity to prevent bright spots on ceiling)
      const glowPts = pts.filter((_, i) => i % 2 === 0);
      if (glowPts.length >= 3) {
        const glowInner = buildFlatTube(glowPts, o.stripThickness * 1.6, 6, materials.glowMat);
        if (glowInner) group.add(glowInner);

        const glowOuter = buildFlatTube(glowPts, o.stripThickness * 2.8, 6, materials.outerGlowMat);
        if (glowOuter) group.add(glowOuter);
      }
    }
  } catch (e) {
    // protect against invalid curve pathing
  }
}

function getPolygonArea(pts) {
  if (!pts || pts.length < 3) return 0;
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

function getPolygonPerimeter(pts) {
  if (!pts || pts.length < 3) return 0;
  let p = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    p += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return p;
}

/**
 * Builds cove rings on BOTH sides (inside + outside) for main building perimeter,
 * and single inside rings for major rooms.
 */
function _buildCoveRingForPolygon(polygon, options, group, materials, addPointLights) {
  // Inside ring — inset toward the polygon interior
  _buildCoveRingForPolygonSide(polygon, options, group, materials, addPointLights, 'inside');
  // Outside ring — outset away from the polygon exterior
  _buildCoveRingForPolygonSide(polygon, options, group, materials, false, 'outside');
}

// =========================================================================
// Main Export: createCoveLighting
// =========================================================================

export function createCoveLighting(opts = {}) {
  const group = new THREE.Group();
  group.name = 'coveLightingAssembly';

  const options = {
    minX: -4,
    maxX: 4,
    minZ: -4,
    maxZ: 4,
    wallPolygons: [],
    wallHeight: 1.10,
    stripColor: '#ffb066',
    stripIntensity: 0.6,
    stripThickness: 0.014,
    gapFromWall: 0.10,
    channelWidth: 0.08,
    channelDepth: 0.05,
    cornerRadius: 0.35, // Smooth, rounded fillet corners by default
    cornerSegments: 20,
    enabled: true,
    ...opts,
  };

  // Clean, modern off-white architectural materials — NO dark/black leakage!
  const ceilingBandMat = new THREE.MeshStandardMaterial({
    color: 0xf6f3ea, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide,
  });
  const channelMat = new THREE.MeshStandardMaterial({
    color: 0xede8df, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide,
  });
  const riserMat = new THREE.MeshStandardMaterial({
    color: 0xe2ddd3, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide,
  });

  // Hyper-bright white-hot core tube — slightly dimmed for realism
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xfff8ee, toneMapped: false,
  });
  // Rich vibrant colored LED tube
  const stripMat = new THREE.MeshBasicMaterial({
    color: options.stripColor, toneMapped: false,
  });
  // Inner warm glow sheath — reduced opacity for soft, natural halo
  const glowMat = new THREE.MeshBasicMaterial({
    color: options.stripColor, transparent: true, opacity: 0.40,
    toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  // Outer ambient glow sheath — very subtle warm aura
  const outerGlowMat = new THREE.MeshBasicMaterial({
    color: options.stripColor, transparent: true, opacity: 0.15,
    toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false,
  });

  function dispose() {
    group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    group.clear();
  }

  function rebuild() {
    dispose();

    if (!options.enabled) return;

    stripMat.color.set(options.stripColor);
    glowMat.color.set(options.stripColor);
    outerGlowMat.color.set(options.stripColor);

    const materials = { ceilingBandMat, channelMat, riserMat, coreMat, stripMat, glowMat, outerGlowMat };

    if (options.wallPolygons && options.wallPolygons.length > 0) {
      // 1. Sort polygons by area (descending) to identify main outer building
      const sorted = options.wallPolygons
        .map(p => ({ poly: cleanPolygon(p), area: getPolygonArea(p), perim: getPolygonPerimeter(p) }))
        .filter(item => item.poly.length >= 3 && item.perim >= 2.8 && item.area >= 0.5)
        .sort((a, b) => b.area - a.area);

      if (sorted.length > 0) {
        // Single clean cove light strip along the wall perimeter ONLY (no inner ceiling light strip)
        _buildCoveRingForPolygonSide(sorted[0].poly, options, group, materials, true, 'outside');
      }
    } else {
      const bboxPoly = [
        { x: options.minX, y: options.minZ },
        { x: options.maxX, y: options.minZ },
        { x: options.maxX, y: options.maxZ },
        { x: options.minX, y: options.maxZ },
      ];
      _buildCoveRingForPolygon(bboxPoly, options, group, materials, true);
    }
  }

  function setOption(key, value) {
    options[key] = value;
    if (key === 'stripColor') {
      stripMat.color.set(value);
      glowMat.color.set(value);
      outerGlowMat.color.set(value);
    }
  }

  rebuild();

  group.userData = {
    isCoveLighting: true,
    type: 'coveLighting',
    options,
    setOption,
    rebuild,
    dispose,
  };

  return group;
}

export default createCoveLighting;
