/**
 * editMode.js
 * ───────────────────────────────────────────────────────────────────────────
 * Real-time 3D model editing mode for the floorplan viewer.
 *
 * ALL assets (new AND existing auto-generated) can be fully edited:
 * selected, moved, rotated, resized, and deleted.
 *
 * Existing assets are re-centered on adoption so that group.position
 * represents the asset center — this makes rotation and resize work
 * correctly around the geometric center.
 * ───────────────────────────────────────────────────────────────────────────
 */

import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULTS = {
  wall:   { width: 1.5,  depth: 0.10 },
  door:   { width: 0.75, depth: 0.10 },
  window: { width: 0.80, depth: 0.06 },
};

const MIN_SIZE       = 0.08;
const HANDLE_RADIUS  = 0.07;
const HANDLE_COLOR   = 0xee3333;
const ROTATE_COLOR   = 0x3399ff;
const OUTLINE_COLOR  = 0x3399ff;
const GHOST_OPACITY  = 0.30;
const STEM_LENGTH    = 0.28;

// ═══════════════════════════════════════════════════════════════════════════
// Y-rotation helpers
// ═══════════════════════════════════════════════════════════════════════════

function localToWorld(lx, lz, cos, sin) {
  return [lx * cos + lz * sin, -lx * sin + lz * cos];
}
function worldToLocal(wx, wz, cos, sin) {
  return [wx * cos - wz * sin, wx * sin + wz * cos];
}

// ═══════════════════════════════════════════════════════════════════════════
// Rectangle polygon for factory functions (scale=1, cx=0, cy=0)
// ═══════════════════════════════════════════════════════════════════════════

function makeRectPoly(width, depth) {
  const hw = width / 2, hd = depth / 2;
  return { outer: [[-hw, hd], [hw, hd], [hw, -hd], [-hw, -hd]] };
}

// ═══════════════════════════════════════════════════════════════════════════
// Visual helpers
// ═══════════════════════════════════════════════════════════════════════════

function makeHandleSphere(color) {
  const geo = new THREE.SphereGeometry(HANDLE_RADIUS, 16, 12);
  const mat = new THREE.MeshBasicMaterial({
    color, depthTest: false, transparent: true, opacity: 0.92,
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 9999;
  return m;
}

function makeStemLine() {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3(),
  ]);
  const mat = new THREE.LineBasicMaterial({
    color: ROTATE_COLOR, depthTest: false, transparent: true, opacity: 0.6,
  });
  const l = new THREE.Line(geo, mat);
  l.renderOrder = 9998;
  return l;
}

// ═══════════════════════════════════════════════════════════════════════════
// EditMode class
// ═══════════════════════════════════════════════════════════════════════════

export class EditMode {
  constructor(o) {
    this.scene      = o.scene;
    this.camera     = o.camera;
    this.renderer   = o.renderer;
    this.controls   = o.controls;
    this.planGroup  = o.planGroup;
    this.canvas     = o.canvas;

    this.wallHeight = o.wallHeight;
    this.doorHeight = o.doorHeight;
    this.windowSill = o.windowSill;
    this.windowTop  = o.windowTop;

    this.createWallFn   = o.createWallFn;
    this.createWindowFn = o.createWindowFn;
    this.createDoorFn   = o.createDoorFn;

    this.onEnterCb  = o.onEnter  || null;
    this.onExitCb   = o.onExit   || null;
    this.onSelectCb = o.onSelect || null;
    this.onColliderChanged = o.onColliderChanged || null;

    // ── State ────────────────────────────────────────────────────────────
    this.active        = false;
    this.state         = 'idle';
    this.placingType   = null;
    this.selectedAsset = null;
    this.editAssets    = [];
    this.newAssets     = [];

    this.savedCam = null;

    // ── Raycasting ───────────────────────────────────────────────────────
    this.ray   = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // ── Drag state ───────────────────────────────────────────────────────
    this.dragStart      = null;
    this.dragAssetStart = null;
    this.dragRotStart   = 0;
    this.dragAngleStart = 0;
    this.activeCorner   = -1;

    // ── Handles ──────────────────────────────────────────────────────────
    this.hGroup = new THREE.Group();
    this.hGroup.name = 'editHandles';
    this.hGroup.visible = false;
    this.scene.add(this.hGroup);
    this.corners = [];
    this.rotHandle = null;
    this.rotStem   = null;
    this.selBox    = null;
    this._initHandles();

    // ── Ghost ────────────────────────────────────────────────────────────
    this.ghostGroup = new THREE.Group();
    this.ghostGroup.name = 'editGhost';
    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);

    // ── Bound handlers ───────────────────────────────────────────────────
    this._md  = this._onDown.bind(this);
    this._mm  = this._onMove.bind(this);
    this._mu  = this._onUp.bind(this);
    this._kd  = this._onKey.bind(this);
    this._ctx = (e) => { if (this.active) e.preventDefault(); };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC
  // ═══════════════════════════════════════════════════════════════════════

  enter() {
    if (this.active) return;
    this.active = true;
    this.savedCam = {
      pos: this.camera.position.clone(), target: this.controls.target.clone(),
      minP: this.controls.minPolarAngle, maxP: this.controls.maxPolarAngle,
      enRot: this.controls.enableRotate,
      minD: this.controls.minDistance, maxD: this.controls.maxDistance,
    };
    const t = this.controls.target.clone();
    this.camera.position.set(t.x, 18, t.z + 0.01);
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = 0.15;
    this.controls.enableRotate  = false;
    this.controls.minDistance    = 3;
    this.controls.maxDistance    = 45;
    this.controls.update();

    this._adoptExistingAssets();

    this.canvas.addEventListener('pointerdown', this._md);
    this.canvas.addEventListener('pointermove', this._mm);
    this.canvas.addEventListener('pointerup',   this._mu);
    window.addEventListener('keydown', this._kd);
    this.canvas.addEventListener('contextmenu', this._ctx);
    if (this.onEnterCb) this.onEnterCb();
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.cancelPlacing();
    this.deselectAll();
    this.state = 'idle';
    this._releaseExistingAssets();
    if (this.savedCam) {
      this.camera.position.copy(this.savedCam.pos);
      this.controls.target.copy(this.savedCam.target);
      this.controls.minPolarAngle = this.savedCam.minP;
      this.controls.maxPolarAngle = this.savedCam.maxP;
      this.controls.enableRotate  = this.savedCam.enRot;
      this.controls.minDistance    = this.savedCam.minD;
      this.controls.maxDistance    = this.savedCam.maxD;
      this.camera.updateProjectionMatrix();
      this.controls.update();
    }
    this.canvas.removeEventListener('pointerdown', this._md);
    this.canvas.removeEventListener('pointermove', this._mm);
    this.canvas.removeEventListener('pointerup',   this._mu);
    window.removeEventListener('keydown', this._kd);
    this.canvas.removeEventListener('contextmenu', this._ctx);
    this.canvas.style.cursor = 'default';
    if (this.onExitCb) this.onExitCb();
  }

  startPlacing(type) {
    this.deselectAll();
    this.placingType = type;
    this.state = 'placing';
    this._buildGhost(type);
    this.ghostGroup.visible = true;
    this.canvas.style.cursor = 'crosshair';
  }

  cancelPlacing() {
    this.placingType = null;
    this.ghostGroup.visible = false;
    this._clearGroup(this.ghostGroup);
    if (this.state === 'placing') this.state = 'idle';
    this.canvas.style.cursor = 'default';
  }

  deleteSelected() {
    if (!this.selectedAsset) return;
    const asset = this.selectedAsset;
    const i = this.editAssets.indexOf(asset);
    if (i >= 0) this.editAssets.splice(i, 1);
    const j = this.newAssets.indexOf(asset);
    if (j >= 0) this.newAssets.splice(j, 1);
    this.planGroup.remove(asset);
    this._disposeGroup(asset);
    this.deselectAll();
    if (this.onColliderChanged) this.onColliderChanged(null);
  }

  deselectAll() {
    if (this.selectedAsset) {
      this.selectedAsset.traverse(c => {
        if (c.isMesh && c.material?.emissive) c.material.emissive.setHex(0);
      });
    }
    this.selectedAsset = null;
    this.hGroup.visible = false;
    if (this.state !== 'placing') this.state = 'idle';
    if (this.onSelectCb) this.onSelectCb(null);
  }

  clearAll() {
    this.deselectAll();
    this.cancelPlacing();
    for (const a of this.newAssets) {
      this.planGroup.remove(a);
      this._disposeGroup(a);
    }
    this.editAssets.length = 0;
    this.newAssets.length = 0;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ADOPT / RELEASE EXISTING ASSETS
  //
  // When adopting, we RE-CENTER the asset's geometry within the group so
  // that group.position = asset center.  This makes rotation and resize
  // work correctly around the geometric center.
  //
  // World position of vertices is unchanged:
  //   Before: group(0,0,0) + child(0,0,0) + vertex = vertex
  //   After:  group(cx,0,cz) + child(-cx,0,-cz) + vertex = vertex  ✓
  // ═══════════════════════════════════════════════════════════════════════

  _adoptExistingAssets() {
    const children = [...this.planGroup.children];
    for (const child of children) {
      const type = child.userData?.assetType;
      if (!type) continue;
      if (child.userData.isEditable) continue;

      // Compute world bounding box
      const box = new THREE.Box3().setFromObject(child);
      if (box.isEmpty()) continue;
      const center = box.getCenter(new THREE.Vector3());
      const size   = box.getSize(new THREE.Vector3());

      // Re-center: shift all direct children so geometry is centered at
      // the group origin, then move the group to the center position.
      if (!child.userData._recentered) {
        for (const sub of child.children) {
          sub.position.x -= center.x;
          sub.position.z -= center.z;
        }
        child.position.set(center.x, 0, center.z);
        child.userData._recentered = true;

        // CRITICAL: Extract local polygon points relative to center so that
        // the PRECISE polygon outline (e.g. L-shaped corner window, complex wall)
        // is preserved and will translate, rotate, and scale with the object.
        if (child.userData.collider && child.userData.collider.pts) {
          child.userData.collider.localPts = child.userData.collider.pts.map(
            ([wx, wz]) => [wx - center.x, wz - center.z]
          );
        }
      }

      child.userData.isEditable   = true;
      child.userData.editType     = type;
      child.userData.origW        = child.userData.origW || Math.max(MIN_SIZE, size.x);
      child.userData.origD        = child.userData.origD || Math.max(MIN_SIZE, size.z);
      child.userData.ew           = (child.userData.origW) * (child.scale.x || 1);
      child.userData.ed           = (child.userData.origD) * (child.scale.z || 1);
      child.userData.eh           = size.y;
      child.userData._isExisting  = true;

      // Preserve the precise polygon collider attached at load time.
      if (!child.userData.collider) {
        const hw = child.userData.ew / 2 + 0.020;
        const hd = child.userData.ed / 2 + 0.020;
        child.userData.collider = {
          localPts: [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]],
          mesh: child,
          assetType: type
        };
      } else {
        child.userData.collider.mesh = child;
        child.userData.collider.assetType = type;
        if (type === 'door') child.userData.collider.doorGroup = child;
      }

      this._updateCollider(child);
      this.editAssets.push(child);
    }
  }

  _releaseExistingAssets() {
    this.editAssets = this.editAssets.filter(a => {
      if (a.userData._isExisting) {
        // Ensure the transformed precise collider is retained
        this._updateCollider(a);
        delete a.userData._origCollider;
        delete a.userData._editedThisSession;
        delete a.userData.isEditable;
        delete a.userData._isExisting;
        return false;
      }
      return true;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLES
  // ═══════════════════════════════════════════════════════════════════════

  _initHandles() {
    for (let i = 0; i < 4; i++) {
      const h = makeHandleSphere(HANDLE_COLOR);
      h.userData.ht = 'corner';
      h.userData.ci = i;
      this.corners.push(h);
      this.hGroup.add(h);
    }
    this.rotHandle = makeHandleSphere(ROTATE_COLOR);
    this.rotHandle.userData.ht = 'rotation';
    this.hGroup.add(this.rotHandle);
    this.rotStem = makeStemLine();
    this.hGroup.add(this.rotStem);

    const bMat = new THREE.LineBasicMaterial({
      color: OUTLINE_COLOR,
      transparent: true, opacity: 0.75, depthTest: false,
    });
    this.selOutline = new THREE.LineSegments(new THREE.BufferGeometry(), bMat);
    this.selOutline.renderOrder = 9997;
    this.hGroup.add(this.selOutline);
    this.selBox = this.selOutline; // backwards compatibility alias
  }

  _syncHandles() {
    const a = this.selectedAsset;
    if (!a) return;
    const w = a.userData.ew, d = a.userData.ed;
    const h = (a.userData.eh || this.wallHeight) * (a.scale.y || 1);
    const rot = a.rotation.y || 0;
    const cx = a.position.x, cz = a.position.z;
    const cos = Math.cos(rot), sin = Math.sin(rot);

    const lc = [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]];
    const hy = h + 0.04;

    for (let i = 0; i < 4; i++) {
      const [lx, lz] = lc[i];
      const [wx, wz] = localToWorld(lx, lz, cos, sin);
      this.corners[i].position.set(cx + wx, hy, cz + wz);
    }

    const [sx, sz] = localToWorld(0, -d/2, cos, sin);
    const [ex, ez] = localToWorld(0, -d/2 - STEM_LENGTH, cos, sin);
    this.rotHandle.position.set(cx + ex, hy, cz + ez);

    const pa = this.rotStem.geometry.attributes.position;
    pa.setXYZ(0, cx + sx, hy, cz + sz);
    pa.setXYZ(1, cx + ex, hy, cz + ez);
    pa.needsUpdate = true;

    // Render PRECISE outline matching the element's actual hitbox polygon
    const col = a.userData?.collider;
    const pts = col?.pts;
    const topY = hy;
    const botY = 0.01;
    const positions = [];
    if (pts && pts.length >= 2) {
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const [x0, z0] = pts[i];
        const [x1, z1] = pts[(i + 1) % n];
        // bottom edge
        positions.push(x0, botY, z0,  x1, botY, z1);
        // top edge
        positions.push(x0, topY, z0,  x1, topY, z1);
        // vertical corner pillar
        positions.push(x0, botY, z0,  x0, topY, z0);
      }
    } else {
      for (let i = 0; i < 4; i++) {
        const [lx0, lz0] = lc[i];
        const [lx1, lz1] = lc[(i + 1) % 4];
        const [wx0, wz0] = localToWorld(lx0, lz0, cos, sin);
        const [wx1, wz1] = localToWorld(lx1, lz1, cos, sin);
        positions.push(cx + wx0, botY, cz + wz0,  cx + wx1, botY, cz + wz1);
        positions.push(cx + wx0, topY, cz + wz0,  cx + wx1, topY, cz + wz1);
        positions.push(cx + wx0, botY, cz + wz0,  cx + wx0, topY, cz + wz0);
      }
    }
    if (this.selOutline.geometry) this.selOutline.geometry.dispose();
    this.selOutline.geometry = new THREE.BufferGeometry();
    this.selOutline.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.selOutline.visible = true;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ASSET CREATION
  // ═══════════════════════════════════════════════════════════════════════

  _createRealAsset(type, width, depth) {
    const poly = makeRectPoly(width, depth);
    if (type === 'wall')   return this.createWallFn(poly, 1, 0, 0);
    if (type === 'window') return this.createWindowFn(poly, 1, 0, 0);
    return this.createDoorFn(poly, 1, 0, 0);
  }

  _buildGhost(type) {
    this._clearGroup(this.ghostGroup);
    if (!type) return;
    const d = DEFAULTS[type];
    const grp = this._createRealAsset(type, d.width, d.depth);
    grp.traverse(c => {
      if (c.isMesh) {
        c.material = c.material.clone();
        c.material.transparent = true;
        c.material.opacity = GHOST_OPACITY;
        c.material.depthWrite = false;
      }
    });
    const wrap = new THREE.Group();
    wrap.add(grp);
    this.ghostGroup.add(wrap);
  }

  _place(pos) {
    const type = this.placingType;
    if (!type) return;
    const d = DEFAULTS[type];
    const grp = this._createRealAsset(type, d.width, d.depth);
    const wrap = new THREE.Group();
    wrap.add(grp);
    wrap.position.set(pos.x, 0, pos.z);
    wrap.userData = {
      isEditable: true, editType: type,
      origW: d.width, origD: d.depth,
      ew: d.width, ed: d.depth, eh: this.wallHeight,
    };
    const hw = d.width / 2 + 0.020;
    const hd = d.depth / 2 + 0.020;
    wrap.userData.collider = {
      localPts: [
        [-hw, -hd],
        [ hw, -hd],
        [ hw,  hd],
        [-hw,  hd]
      ],
      assetType: type,
      mesh: wrap,
      doorGroup: (type === 'door') ? wrap : null
    };
    this._updateCollider(wrap);
    this.planGroup.add(wrap);
    this.editAssets.push(wrap);
    this.newAssets.push(wrap);
    this.ghostGroup.visible = false;
    this._select(wrap);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SELECTION
  // ═══════════════════════════════════════════════════════════════════════

  _select(asset) {
    this.deselectAll();
    this.selectedAsset = asset;
    this.state = 'selected';
    asset.traverse(c => {
      if (c.isMesh && c.material?.emissive) c.material.emissive.setHex(0x222222);
    });
    this._syncHandles();
    this.hGroup.visible = true;
    if (this.onSelectCb) this.onSelectCb(asset);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REBUILD — works for BOTH new and existing assets
  // Replaces all children with fresh factory geometry at the new size.
  // ═══════════════════════════════════════════════════════════════════════

  _rebuild(asset) {
    const type = asset.userData.editType;
    const w = asset.userData.ew, d = asset.userData.ed;
    const savedRot = asset.rotation.y;
    const savedPos = asset.position.clone();

    // Remove ALL old children
    while (asset.children.length) {
      const c = asset.children[0];
      asset.remove(c);
      this._disposeGroup(c);
    }

    // Create fresh asset with new dimensions (centered at origin)
    const newGrp = this._createRealAsset(type, w, d);
    asset.add(newGrp);

    // Restore transform
    asset.position.copy(savedPos);
    asset.rotation.y = savedRot;

    // Re-apply selection highlight
    if (this.selectedAsset === asset) {
      asset.traverse(c => {
        if (c.isMesh && c.material?.emissive) c.material.emissive.setHex(0x222222);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RAYCASTING
  // ═══════════════════════════════════════════════════════════════════════

  _floorPt(e) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.ray.setFromCamera(this.mouse, this.camera);
    const pt = new THREE.Vector3();
    return this.ray.ray.intersectPlane(this.plane, pt) ? pt : null;
  }

  _hitHandle(e) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.ray.setFromCamera(this.mouse, this.camera);
    return this.ray.intersectObjects([...this.corners, this.rotHandle], false)[0]?.object ?? null;
  }

  _hitAsset(e) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.ray.setFromCamera(this.mouse, this.camera);
    const meshes = [];
    for (const a of this.editAssets) a.traverse(c => { if (c.isMesh) meshes.push(c); });
    const hit = this.ray.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    let obj = hit.object;
    while (obj && !obj.userData?.isEditable) obj = obj.parent;
    return obj;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MOUSE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  _onDown(e) {
    if (e.button !== 0) return;
    const fp = this._floorPt(e);
    if (!fp) return;

    if (this.state === 'placing') { this._place(fp); return; }

    // Handle hit
    if (this.selectedAsset && this.hGroup.visible) {
      const h = this._hitHandle(e);
      if (h) {
        if (h.userData.ht === 'corner') {
          this.state = 'resizing';
          this.activeCorner = h.userData.ci;
        } else {
          this.state = 'rotating';
          this.dragRotStart = this.selectedAsset.rotation.y;
          const cx = this.selectedAsset.position.x;
          const cz = this.selectedAsset.position.z;
          this.dragAngleStart = Math.atan2(fp.z - cz, fp.x - cx);
        }
        this.dragStart = fp.clone();
        this.controls.enabled = false;
        e.stopPropagation();
        return;
      }
    }

    // Asset hit
    const asset = this._hitAsset(e);
    if (asset) {
      if (asset === this.selectedAsset) {
        this.state = 'moving';
        this.dragStart = fp.clone();
        this.dragAssetStart = asset.position.clone();
        this.controls.enabled = false;
      } else {
        this._select(asset);
      }
      e.stopPropagation();
      return;
    }

    if (this.state === 'selected') this.deselectAll();
  }

  _onMove(e) {
    const fp = this._floorPt(e);
    if (!fp) return;

    if (this.state === 'placing' && this.ghostGroup.children[0]) {
      this.ghostGroup.visible = true;
      this.ghostGroup.children[0].position.set(fp.x, 0, fp.z);
    }

    if (this.state === 'moving' && this.selectedAsset && this.dragStart) {
      this.selectedAsset.position.x = this.dragAssetStart.x + (fp.x - this.dragStart.x);
      this.selectedAsset.position.z = this.dragAssetStart.z + (fp.z - this.dragStart.z);
      this._updateCollider(this.selectedAsset);
      this._syncHandles();
    }

    if (this.state === 'resizing' && this.selectedAsset) this._doResize(fp);

    if (this.state === 'rotating' && this.selectedAsset) {
      const cx = this.selectedAsset.position.x;
      const cz = this.selectedAsset.position.z;
      const a = Math.atan2(fp.z - cz, fp.x - cx);
      let nr = this.dragRotStart + (a - this.dragAngleStart);
      if (e.shiftKey) nr = Math.round(nr / (Math.PI / 4)) * (Math.PI / 4);
      this.selectedAsset.rotation.y = nr;
      this._updateCollider(this.selectedAsset);
      this._syncHandles();
    }

    if (this.state === 'idle' || this.state === 'selected') {
      if (this.hGroup.visible) {
        const h = this._hitHandle(e);
        if (h) {
          this.canvas.style.cursor = h.userData.ht === 'corner' ? 'nwse-resize' : 'grab';
          return;
        }
      }
      const a = this._hitAsset(e);
      if (a) {
        this.canvas.style.cursor = a === this.selectedAsset ? 'move' : 'pointer';
        return;
      }
      this.canvas.style.cursor = this.state === 'placing' ? 'crosshair' : 'default';
    }
  }

  _onUp() {
    if (this.state === 'moving' || this.state === 'resizing' || this.state === 'rotating') {
      if (this.selectedAsset) {
        this._updateCollider(this.selectedAsset);
      }
      this.state = 'selected';
      this.controls.enabled = true;
      this.dragStart = null;
    }
  }

  _onKey(e) {
    if (!this.active) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedAsset) {
      e.preventDefault(); this.deleteSelected();
    }
    if (e.key === 'Escape') {
      if (this.state === 'placing') this.cancelPlacing();
      else if (this.state === 'selected') this.deselectAll();
      else this.exit();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RESIZE — scales asset and preserves precise hitbox geometry
  // ═══════════════════════════════════════════════════════════════════════

  _doResize(fp) {
    const a = this.selectedAsset;
    const w = a.userData.ew, d = a.userData.ed;
    const rot = a.rotation.y || 0;
    const cx = a.position.x, cz = a.position.z;
    const cos = Math.cos(rot), sin = Math.sin(rot);

    const lc = [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]];
    const fi = (this.activeCorner + 2) % 4;
    const [flx, flz] = lc[fi];
    const [fo_x, fo_z] = localToWorld(flx, flz, cos, sin);
    const fwx = cx + fo_x, fwz = cz + fo_z;
    const dx = fp.x - fwx, dz = fp.z - fwz;
    const [ldx, ldz] = worldToLocal(dx, dz, cos, sin);

    a.position.x = (fwx + fp.x) / 2;
    a.position.z = (fwz + fp.z) / 2;
    a.userData.ew = Math.max(MIN_SIZE, Math.abs(ldx));
    a.userData.ed = Math.max(MIN_SIZE, Math.abs(ldz));

    const origW = a.userData.origW || w;
    const origD = a.userData.origD || d;
    const scaleX = a.userData.ew / (origW || 1);
    const scaleZ = a.userData.ed / (origD || 1);

    a.scale.set(scaleX, 1, scaleZ);

    this._updateCollider(a);
    this._syncHandles();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COLLIDERS — dynamic precise hitboxes matching position, rotation & scale
  // ═══════════════════════════════════════════════════════════════════════

  _transformCollider(a) {
    if (!a) return null;
    let col = a.userData?.collider;

    // Ensure localPts exists on the collider (preserves exact polygon vertices)
    if (!col?.localPts) {
      if (col?.pts && col.pts.length >= 3) {
        const cx = a.position.x || 0;
        const cz = a.position.z || 0;
        col.localPts = col.pts.map(([wx, wz]) => [wx - cx, wz - cz]);
      } else {
        const w = a.userData?.origW || a.userData?.ew || DEFAULTS[a.userData?.editType]?.width || 1.0;
        const d = a.userData?.origD || a.userData?.ed || DEFAULTS[a.userData?.editType]?.depth || 0.10;
        const pad = 0.020;
        const hw = w / 2 + pad;
        const hd = d / 2 + pad;
        if (!col) col = {};
        col.localPts = [
          [-hw, -hd],
          [ hw, -hd],
          [ hw,  hd],
          [-hw,  hd]
        ];
      }
    }

    const rot = a.rotation.y || 0;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const cx = a.position.x || 0;
    const cz = a.position.z || 0;
    const sx = (a.scale && a.scale.x !== undefined) ? a.scale.x : 1;
    const sz = (a.scale && a.scale.z !== undefined) ? a.scale.z : 1;

    // Transform each precise local point by scale, rotation, and translation
    const wPts = col.localPts.map(([lx, lz]) => {
      const slx = lx * sx;
      const slz = lz * sz;
      const [wx, wz] = localToWorld(slx, slz, cos, sin);
      return [cx + wx, cz + wz];
    });

    const edges = [];
    let mnX = Infinity, mxX = -Infinity, mnZ = Infinity, mxZ = -Infinity;
    const n = wPts.length;

    for (let i = 0; i < n; i++) {
      const [x1, z1] = wPts[i];
      const [x2, z2] = wPts[(i + 1) % n];
      mnX = Math.min(mnX, x1); mxX = Math.max(mxX, x1);
      mnZ = Math.min(mnZ, z1); mxZ = Math.max(mxZ, z1);
      const edx = x2 - x1, edz = z2 - z1;
      const len = Math.hypot(edx, edz);
      if (len > 0.0001) {
        edges.push({
          x1, z1, x2, z2,
          dx: edx, dz: edz, len,
          nx: -edz / len, nz: edx / len
        });
      }
    }

    const updated = {
      pts: wPts,
      edges,
      bbox: { minX: mnX, maxX: mxX, minZ: mnZ, maxZ: mxZ },
      mesh: a,
      localPts: col.localPts,
      doorGroup: (a.userData?.editType === 'door' || a.userData?.assetType === 'door') ? a : (col.doorGroup || null),
      assetType: a.userData?.editType || a.userData?.assetType || col.assetType
    };

    a.userData.collider = updated;
    return updated;
  }

  _computeCollider(a) {
    return this._transformCollider(a);
  }

  _updateCollider(a) {
    if (!a) return;
    a.userData._editedThisSession = true;
    a.userData.collider = this._transformCollider(a);
    if (this.onColliderChanged) this.onColliderChanged(a);
  }

  getColliders() {
    const result = [];
    for (const a of this.editAssets) {
      if (!a.parent) continue;
      if (a.userData.editType === 'door' || a.userData.assetType === 'door') {
        let isOpen = false;
        if (a.userData.isOpen) isOpen = true;
        a.traverse(obj => { if (obj.userData?.isDoor && obj.userData.isOpen) isOpen = true; });
        if (isOpen) continue;
      }
      const col = a.userData.collider || this._transformCollider(a);
      if (col) result.push(col);
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILS
  // ═══════════════════════════════════════════════════════════════════════

  _disposeGroup(obj) {
    obj.traverse(c => { if (c.geometry) c.geometry.dispose(); });
  }

  _clearGroup(g) {
    while (g.children.length) {
      const c = g.children[0]; g.remove(c); this._disposeGroup(c);
    }
  }

  dispose() {
    this.exit();
    if (this.selOutline?.geometry) this.selOutline.geometry.dispose();
    if (this.selOutline?.material) this.selOutline.material.dispose();
    this.scene.remove(this.hGroup);
    this.scene.remove(this.ghostGroup);
    this._clearGroup(this.hGroup);
    this._clearGroup(this.ghostGroup);
  }
}

export default EditMode;
