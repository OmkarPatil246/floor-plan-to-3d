/**
 * ceiling.js
 * -------------------------------------------------------------------------
 * Realistic interior CEILING asset for Three.js.
 *
 * Creates a flat ceiling slab at the specified height (WALL_HEIGHT) that
 * covers the entire floorplan footprint. Includes:
 *   1. Main ceiling slab — slightly off-white, receives shadows from walls.
 *   2. Crown moulding / cornice trim around the perimeter.
 *   3. Subtle recessed panel lines for visual depth.
 *
 * The ceiling is built from the overall wall polygon bounding box so it
 * spans the entire building footprint. It uses a separate animation:
 * instead of rising from the floor like walls, it "descends" from above
 * and settles into place at WALL_HEIGHT — like a lid being placed on
 * a doll's house.
 *
 * Coordinate convention (shared by every asset in this set):
 *   - The ceiling plane sits at Y = wallHeight.
 *   - It extends in X/Z to cover [minX..maxX] x [minZ..maxZ] of the
 *     building footprint (derived from wall polygon bounding box).
 *
 * INTERACTION API:
 *   ceiling.userData.isCeiling          -> true
 *   ceiling.userData.type               -> 'ceiling'
 *   ceiling.userData.toggleVisibility() -> show/hide for interior viewing
 *   ceiling.userData.isVisible          -> boolean
 *
 * Usage (inside index.html loadPlan):
 *   import { createCeilingAssembly } from './Assets/ceiling.js';
 *   const ceiling = createCeilingAssembly({ ... });
 *   planGroup.add(ceiling);
 * -------------------------------------------------------------------------
 */

import * as THREE from 'three';

function addEdges(mesh, color = 0x1a1a1a, opacity = 0.12) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 20);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  mesh.add(line);
  return line;
}

/**
 * Create a ceiling assembly group.
 *
 * @param {Object} opts
 * @param {number} opts.minX   - World-space left edge of the building footprint
 * @param {number} opts.maxX   - World-space right edge
 * @param {number} opts.minZ   - World-space near edge
 * @param {number} opts.maxZ   - World-space far edge
 * @param {number} opts.wallHeight - Y position the ceiling sits at
 * @param {number} opts.ceilingColor - Base color of the ceiling (default: warm white)
 * @param {number} opts.corniceColor - Color of the crown moulding (default: clean white)
 * @returns {THREE.Group}
 */
export function createCeilingAssembly({
  minX = -4,
  maxX = 4,
  minZ = -4,
  maxZ = 4,
  wallHeight = 1.10,
  ceilingColor = 0xf8f6f2,
  corniceColor = 0xf4f0e8,
} = {}) {
  const group = new THREE.Group();
  group.name = 'ceilingAssembly';

  const width  = maxX - minX;
  const depth  = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Overhang so the ceiling properly covers the entire structure with a clean architectural lip
  const overhang = 0.080;
  const slabW = width + overhang * 2;
  const slabD = depth + overhang * 2;

  // -----------------------------------------------------------------------
  // 1. MAIN CEILING SLAB — thin flat box at wallHeight
  // -----------------------------------------------------------------------
  const slabThickness = 0.035;
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: ceilingColor,
    roughness: 0.72,     // freshly-painted ceiling: smoother than walls
    metalness: 0.0,
    side: THREE.DoubleSide,  // visible from below in walkthrough
  });

  const slabGeom = new THREE.BoxGeometry(slabW, slabThickness, slabD);
  const slab = new THREE.Mesh(slabGeom, ceilingMat);
  slab.position.set(centerX, wallHeight + slabThickness / 2, centerZ);
  slab.castShadow = true;
  slab.receiveShadow = true;
  addEdges(slab, 0x1a1a1a, 0.06);
  group.add(slab);

  // -----------------------------------------------------------------------
  // 2. NO CROWN MOULDING ON CEILING
  //    Crown molding is only applied to walls, doors, and windows.
  //    The ceiling remains clean without perimeter trim.
  // -----------------------------------------------------------------------
  // (Crown molding removed from ceiling - only applied to walls now)

  // -----------------------------------------------------------------------
  // 3. NO RECESSED PANEL LINES
  //    Panel lines removed - ceiling is now completely clean and simple.
  // -----------------------------------------------------------------------
  // (Panel lines removed - clean ceiling surface only)

  // -----------------------------------------------------------------------
  // INTERACTION API
  // -----------------------------------------------------------------------
  let isVisible = true;

  group.userData = {
    isCeiling: true,
    type: 'ceiling',
    isVisible,
    toggleVisibility() {
      isVisible = !isVisible;
      group.visible = isVisible;
      this.isVisible = isVisible;
    },
  };

  return group;
}

export default createCeilingAssembly;
