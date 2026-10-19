/**
 * window.js
 * -------------------------------------------------------------------------
 * Realistic classic-home SLIDING WINDOW ASSEMBLY for Three.js — SCALE-SAFE.
 *
 * WHY THIS VERSION EXISTS
 * Previously, frame thickness, sash bars, sill ledge, handles, and the
 * mullion were all fixed absolute sizes. That looks right only near the
 * original demo dimensions — a small window kept full-size hardware
 * (looks chunky/oversized), a large window kept the same thin bars
 * (looks flimsy). This version scales every detail by the window's own
 * size relative to a reference size (geometric similarity), clamped so
 * extreme aspect ratios never produce inverted/negative geometry.
 *
 * SLIDING BEHAVIOUR (per spec):
 *   - The two sashes open independently — whichever the player looks at
 *     slides.
 *   - LEFT sash slides RIGHT, overlapping the right sash.
 *   - RIGHT sash slides LEFT, passing behind the left sash.
 *
 * INTERACTION API:
 *   win.userData.isInteractable   -> true
 *   win.userData.type             -> 'windowAssembly'
 *   win.userData.supportsTexture  -> false (wall/door only, per spec)
 *   win.userData.leftSash / rightSash  -> THREE.Object3D (raycast targets)
 *   win.userData.toggleSash(sashObjectOrSide)
 *   win.userData.openSash(side) / .closeSash(side)
 *   win.userData.update(delta)    -> call every frame to animate
 *   win.userData.resize(newOptions) -> rebuilds this SAME group in place;
 *       all hardware/frame proportions re-scale correctly.
 *
 * Coordinate convention:
 *   - Origin (0,0,0) = bottom-center of the whole assembly footprint (floor).
 *   - +X -> width, +Y -> up, +Z -> thickness (centered on Z=0).
 * -------------------------------------------------------------------------
 */

import * as THREE from 'three';

// Reference size the frame/hardware proportions were designed at.
const REF_WIDTH = 1.2;
const REF_WINDOW_HEIGHT = 1.2;

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

/** Geometric-similarity scale factor vs. the reference window size. */
export function computeScaleFactor(width, windowHeight) {
  return Math.sqrt((width / REF_WIDTH) * (windowHeight / REF_WINDOW_HEIGHT));
}

function addEdges(mesh, color = 0x1a1a1a, opacity = 0.18) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 15);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  mesh.add(line);
  return line;
}

function disposeChildren(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.traverse?.((o) => {
      o.geometry?.dispose?.();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.());
      }
    });
  }
}

/** Same skirting detail used by wall.js — duplicated to keep this file
 *  fully self-contained (single-file-per-asset requirement). Scale-safe. */
function buildSkirting({ width, depth, height, skirtingColor, scaleFactor }) {
  const skirtingHeight = clamp(0.11 * scaleFactor, 0.015, height * 0.28);
  const protrusion = clamp(0.018 * scaleFactor, 0.003, depth * 0.6);

  const group = new THREE.Group();
  group.name = 'skirting';

  const skirtingMat = new THREE.MeshStandardMaterial({ color: skirtingColor, roughness: 0.35, metalness: 0.0 });

  const board = new THREE.Mesh(new THREE.BoxGeometry(width, skirtingHeight, protrusion * 2), skirtingMat);
  board.position.set(0, skirtingHeight / 2, depth / 2 + protrusion / 2);
  board.castShadow = true;
  board.receiveShadow = true;
  addEdges(board, 0x2b2b2b, 0.12);
  group.add(board);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(width, skirtingHeight * 0.16, protrusion * 2.6), skirtingMat);
  cap.position.set(0, skirtingHeight - skirtingHeight * 0.08, depth / 2 + protrusion / 1.3);
  cap.castShadow = true;
  addEdges(cap, 0x2b2b2b, 0.1);
  group.add(cap);

  return group;
}

function build(group, opts) {
  const {
    width = 1.2,
    windowHeight = 1.2,
    sillHeight = 0.9,
    wallHeight = 2.8,
    depth = 0.15,
    frameColor = 0xfbfbf8,
    glassColor = 0xbfe3ef,
    wallColor = 0xede7da,
    skirtingColor = 0xf6f3ec,
  } = opts;

  disposeChildren(group);
  group.name = 'windowAssembly';

  // -----------------------------------------------------------------
  // SCALE-SAFE DETAIL SIZING — see file header. At reference size
  // (1.2m x 1.2m opening) scaleFactor === 1 and matches the original
  // hand-tuned design exactly.
  // -----------------------------------------------------------------
  const s = computeScaleFactor(width, windowHeight);
  const minDim = Math.min(width, windowHeight);

  const frameThickness = clamp(0.06 * s, 0.01, minDim * 0.18);
  const sashFrameW = clamp(0.035 * s, 0.006, minDim * 0.12);
  const trackGap = clamp(0.012 * s, 0.002, depth * 0.35);

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.92 });
  const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.4, metalness: 0.02 });
  const sillMat = new THREE.MeshStandardMaterial({ color: 0xe9e9e4, roughness: 0.5, metalness: 0.02 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: glassColor,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.55,
    thickness: 0.01,
    reflectivity: 0.5,
  });
  const trackMat = new THREE.MeshStandardMaterial({ color: 0xcfcfc9, roughness: 0.3, metalness: 0.6 });
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.25, metalness: 0.85 });

  const upperHeight = Math.max(wallHeight - sillHeight - windowHeight, 0);

  // ---------------------------------------------------------------------
  // 1. LOWER WALL infill (floor -> sill) — WITH skirting
  // ---------------------------------------------------------------------
  if (sillHeight > 0.001) {
    const lowerWall = new THREE.Mesh(new THREE.BoxGeometry(width, sillHeight, depth), wallMat);
    lowerWall.position.set(0, sillHeight / 2, 0);
    lowerWall.castShadow = true;
    lowerWall.receiveShadow = true;
    addEdges(lowerWall, 0x1a1a1a, 0.08);
    group.add(lowerWall);
    group.add(buildSkirting({ width, depth, height: sillHeight, skirtingColor, scaleFactor: s }));
  }

  // ---------------------------------------------------------------------
  // 2. UPPER WALL infill (window top -> ceiling) — NO skirting
  // ---------------------------------------------------------------------
  if (upperHeight > 0.001) {
    const upperWall = new THREE.Mesh(new THREE.BoxGeometry(width, upperHeight, depth), wallMat);
    upperWall.position.set(0, sillHeight + windowHeight + upperHeight / 2, 0);
    upperWall.castShadow = true;
    upperWall.receiveShadow = true;
    addEdges(upperWall, 0x1a1a1a, 0.08);
    group.add(upperWall);
  }

  // ---------------------------------------------------------------------
  // 3. WINDOW FRAME (outer border, static) + external sill ledge
  // ---------------------------------------------------------------------
  const frameGroup = new THREE.Group();
  frameGroup.name = 'windowFrame';
  const winY0 = sillHeight;
  const winY1 = sillHeight + windowHeight;

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(width, frameThickness, depth), frameMat);
  topBar.position.set(0, winY1 - frameThickness / 2, 0);
  addEdges(topBar, 0x1a1a1a, 0.15);
  frameGroup.add(topBar);

  const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(width, frameThickness, depth), frameMat);
  bottomBar.position.set(0, winY0 + frameThickness / 2, 0);
  addEdges(bottomBar, 0x1a1a1a, 0.15);
  frameGroup.add(bottomBar);

  const sideH = Math.max(windowHeight - frameThickness * 2, 0.02);
  const leftBar = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, sideH, depth), frameMat);
  leftBar.position.set(-width / 2 + frameThickness / 2, winY0 + windowHeight / 2, 0);
  addEdges(leftBar, 0x1a1a1a, 0.15);
  frameGroup.add(leftBar);

  const rightBar = leftBar.clone();
  rightBar.position.x = width / 2 - frameThickness / 2;
  frameGroup.add(rightBar);

  group.add(frameGroup);

  const sillH = clamp(0.035 * s, 0.008, frameThickness * 1.2);
  const sillOverhang = clamp(0.08 * s, 0.015, width * 0.15);
  const sillDepthExtra = clamp(0.09 * s, 0.02, depth * 1.5);
  const sillLedge = new THREE.Mesh(
    new THREE.BoxGeometry(width + sillOverhang, sillH, depth + sillDepthExtra),
    sillMat
  );
  sillLedge.position.set(0, winY0 + sillH / 2, clamp(0.02 * s, 0.004, sillDepthExtra * 0.4));
  sillLedge.castShadow = true;
  addEdges(sillLedge, 0x1a1a1a, 0.15);
  group.add(sillLedge);

  // ---------------------------------------------------------------------
  // 4. SLIDING SASHES — each is its own Object3D so it can be independently
  //    raycast-hit and independently animated.
  // ---------------------------------------------------------------------
  const innerW = Math.max(width - frameThickness * 2, 0.05);
  const innerH = Math.max(windowHeight - frameThickness * 2, 0.05);
  const sashW = innerW / 2;
  const barDepth = clamp(0.03 * s, 0.006, depth * 1.5);
  const handleW = clamp(0.02 * s, 0.004, sashW * 0.15);
  const handleH = clamp(0.07 * s, 0.015, innerH * 0.25);
  const handleD = clamp(0.015 * s, 0.003, barDepth);
  const handleZ = clamp(0.02 * s, 0.004, handleD * 2);
  const glazingBarH = clamp(0.02 * s, 0.004, innerH * 0.04);
  const glazingBarD = clamp(0.015 * s, 0.003, barDepth);
  const glazingBarZ = clamp(0.008 * s, 0.002, glazingBarD);
  const glassMargin = clamp(0.01 * s, 0.002, sashFrameW * 0.6);

  function buildSash(name, homeX, zOffset, handleOnRightEdge) {
    const sash = new THREE.Group();
    sash.name = name;

    const top = new THREE.Mesh(new THREE.BoxGeometry(sashW, sashFrameW, barDepth), frameMat);
    top.position.set(0, innerH - sashFrameW / 2 + frameThickness, 0);
    addEdges(top, 0x1a1a1a, 0.12);
    sash.add(top);

    const bottom = top.clone();
    bottom.position.y = sashFrameW / 2 + frameThickness;
    sash.add(bottom);

    const left = new THREE.Mesh(new THREE.BoxGeometry(sashFrameW, innerH, barDepth), frameMat);
    left.position.set(-sashW / 2 + sashFrameW / 2, frameThickness + innerH / 2, 0);
    addEdges(left, 0x1a1a1a, 0.12);
    sash.add(left);

    const right = left.clone();
    right.position.x = sashW / 2 - sashFrameW / 2;
    sash.add(right);

    const glassW = Math.max(sashW - sashFrameW * 2 - glassMargin, 0.02);
    const glassH = Math.max(innerH - sashFrameW * 2 - glassMargin, 0.02);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(glassW, glassH), glassMat);
    glass.position.set(0, frameThickness + innerH / 2, 0);
    sash.add(glass);

    const glazingBar = new THREE.Mesh(new THREE.BoxGeometry(glassW, glazingBarH, glazingBarD), frameMat);
    glazingBar.position.set(0, frameThickness + innerH / 2, glazingBarZ);
    sash.add(glazingBar);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(handleW, handleH, handleD), handleMat);
    const handleX = handleOnRightEdge ? sashW / 2 - handleInsetSafe(sashW) : -sashW / 2 + handleInsetSafe(sashW);
    handle.position.set(handleX, frameThickness + innerH * 0.15, handleZ);
    sash.add(handle);

    sash.position.set(homeX, winY0, zOffset);
    return sash;
  }

  function handleInsetSafe(w) {
    return clamp(0.05 * s, 0.01, w * 0.3);
  }

  const leftHomeX = -sashW / 2;
  const rightHomeX = sashW / 2;
  const leftSash = buildSash('leftSash', leftHomeX, -trackGap, true);
  const rightSash = buildSash('rightSash', rightHomeX, trackGap, false);
  group.add(leftSash);
  group.add(rightSash);

  const mullionW = clamp(0.02 * s, 0.004, sashFrameW * 0.8);
  const mullionBack = new THREE.Mesh(new THREE.BoxGeometry(mullionW, innerH, mullionW), trackMat);
  mullionBack.position.set(0, winY0 + frameThickness + innerH / 2, -trackGap);
  group.add(mullionBack);
  const mullionFront = mullionBack.clone();
  mullionFront.position.z = trackGap;
  group.add(mullionFront);

  const trackGrooveH = clamp(0.012 * s, 0.003, frameThickness * 0.6);
  const trackGrooveD = clamp(0.03 * s, 0.006, barDepth * 1.2);
  const trackGroove = new THREE.Mesh(new THREE.BoxGeometry(innerW, trackGrooveH, trackGrooveD), trackMat);
  trackGroove.position.set(0, winY0 + frameThickness + trackGrooveH / 2, 0);
  group.add(trackGroove);

  // ---------------------------------------------------------------------
  // 5. SLIDE ANIMATION
  //    - Left sash open target: home + sashW (slides RIGHT, over the right sash)
  //    - Right sash open target: home - sashW (slides LEFT, behind the left sash)
  // ---------------------------------------------------------------------
  const slideDistance = sashW * 0.92;
  const animSpeed = 4.0;

  const sashState = {
    left: { obj: leftSash, home: leftHomeX, openTarget: leftHomeX + slideDistance, isOpen: false, target: leftHomeX },
    right: { obj: rightSash, home: rightHomeX, openTarget: rightHomeX - slideDistance, isOpen: false, target: rightHomeX },
  };

  function resolveSide(sashObjectOrSide) {
    if (sashObjectOrSide === 'left' || sashObjectOrSide === leftSash) return 'left';
    if (sashObjectOrSide === 'right' || sashObjectOrSide === rightSash) return 'right';
    let obj = sashObjectOrSide;
    while (obj) {
      if (obj === leftSash) return 'left';
      if (obj === rightSash) return 'right';
      obj = obj.parent;
    }
    return null;
  }

  function openSash(side) {
    const s2 = sashState[resolveSide(side)];
    if (!s2) return;
    s2.isOpen = true;
    s2.target = s2.openTarget;
  }
  function closeSash(side) {
    const s2 = sashState[resolveSide(side)];
    if (!s2) return;
    s2.isOpen = false;
    s2.target = s2.home;
  }
  function toggleSash(side) {
    const key = resolveSide(side);
    const s2 = sashState[key];
    if (!s2) return;
    s2.isOpen ? closeSash(key) : openSash(key);
  }

  function update(delta) {
    [sashState.left, sashState.right].forEach((st) => {
      if (Math.abs(st.obj.position.x - st.target) < 0.0005) {
        st.obj.position.x = st.target;
        return;
      }
      const t = 1 - Math.exp(-animSpeed * delta);
      st.obj.position.x += (st.target - st.obj.position.x) * t;
    });
  }

  // ---------------------------------------------------------------------
  // 6. RESIZE — rebuilds this same THREE.Group in place with merged opts.
  //    Sashes reset to closed on resize.
  // ---------------------------------------------------------------------
  function resize(newOpts) {
    const merged = { ...opts, ...newOpts };
    build(group, merged);
  }

  group.userData = {
    type: 'windowAssembly',
    width,
    height: wallHeight,
    windowHeight,
    sillHeight,
    depth,
    hasSkirting: true,
    isInteractable: true,
    supportsTexture: false,
    leftSash,
    rightSash,
    openSash,
    closeSash,
    toggleSash,
    update,
    resize,
    options: opts,
  };
}

/**
 * @param {Object} opts
 * @param {number} opts.width         overall window opening width (incl. frame)
 * @param {number} opts.windowHeight  height of the window opening itself
 * @param {number} opts.sillHeight    height from floor to bottom of window
 * @param {number} opts.wallHeight    full wall height the asset must fill
 * @param {number} opts.depth         wall thickness
 * @param {number} opts.frameColor    window frame color (classic white)
 * @param {number} opts.glassColor    glass tint
 * @param {number} opts.wallColor     upper/lower infill wall color
 * @param {number} opts.skirtingColor skirting color for the lower wall
 */
export function createWindowAssembly(opts = {}) {
  const group = new THREE.Group();
  build(group, opts);
  return group;
}

export default createWindowAssembly;
