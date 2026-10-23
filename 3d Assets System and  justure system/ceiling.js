/**
 * ceiling.js
 * -------------------------------------------------------------------------
 * Realistic interior CEILING asset for Three.js.
 * Adapted for VR mode - lightweight version without complex features.
 */

// Simple ceiling creation function (no imports needed - uses global THREE)
function createCeilingAssembly({
  minX = -4,
  maxX = 4,
  minZ = -4,
  maxZ = 4,
  wallHeight = 1.10,
  ceilingColor = 0xf8f6f2,
} = {}) {
  const group = new THREE.Group();
  group.name = 'ceilingAssembly';

  const width  = maxX - minX;
  const depth  = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Overhang so the ceiling properly covers the entire structure
  const overhang = 0.080;
  const slabW = width + overhang * 2;
  const slabD = depth + overhang * 2;

  // Main ceiling slab
  const slabThickness = 0.035;
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: ceilingColor,
    roughness: 0.72,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const slabGeom = new THREE.BoxGeometry(slabW, slabThickness, slabD);
  const slab = new THREE.Mesh(slabGeom, ceilingMat);
  slab.position.set(centerX, wallHeight + slabThickness / 2, centerZ);
  slab.castShadow = true;
  slab.receiveShadow = true;
  group.add(slab);

  // Add subtle edges for definition
  const edges = new THREE.EdgesGeometry(slab.geometry, 20);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.06 })
  );
  slab.add(line);

  group.userData = {
    isCeiling: true,
    type: 'ceiling',
    isVisible: true,
  };

  return group;
}
