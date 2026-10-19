import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { HandGestureController } from './gestureController.js';

/**
 * Compact, sleek Selection Bounding Box with small Corner Resize Handles.
 */
class SleekCornerBoxHelper {
    constructor(scene) {
        this.scene = scene;
        this.target = null;
        this.group = new THREE.Group();
        this.group.name = 'SleekSelectionBoxGroup';

        // 12 Line edges
        const lineGeo = new THREE.BufferGeometry();
        const posArray = new Float32Array(12 * 2 * 3);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        this.lineMat = new THREE.LineBasicMaterial({
            color: 0x00f7ff,
            linewidth: 1.5,
            depthTest: false,
            transparent: true,
            opacity: 0.9
        });
        this.lines = new THREE.LineSegments(lineGeo, this.lineMat);
        this.lines.renderOrder = 998;
        this.group.add(this.lines);

        // 8 Small, sleek corner handles (compact 0.065m cubes)
        this.handles = [];
        this.handleGeo = new THREE.BoxGeometry(0.065, 0.065, 0.065);

        for (let i = 0; i < 8; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: 0x00f7ff,
                depthTest: false,
                transparent: true,
                opacity: 0.95
            });
            const handle = new THREE.Mesh(this.handleGeo, mat);
            handle.userData = { isCornerHandle: true, cornerIndex: i };
            handle.renderOrder = 999;
            this.handles.push(handle);
            this.group.add(handle);
        }

        this.group.visible = false;
        this.scene.add(this.group);

        this.box = new THREE.Box3();
        this.corners = [
            new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
            new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
        ];
    }

    setFromObject(object) {
        if (!object) {
            this.target = null;
            this.group.visible = false;
            return;
        }
        this.target = object;
        this.update();
        this.group.visible = true;
    }

    update() {
        if (!this.target) return;
        this.box.setFromObject(this.target);

        const min = this.box.min;
        const max = this.box.max;

        this.corners[0].set(min.x, min.y, min.z);
        this.corners[1].set(max.x, min.y, min.z);
        this.corners[2].set(max.x, min.y, max.z);
        this.corners[3].set(min.x, min.y, max.z);
        this.corners[4].set(min.x, max.y, min.z);
        this.corners[5].set(max.x, max.y, min.z);
        this.corners[6].set(max.x, max.y, max.z);
        this.corners[7].set(min.x, max.y, max.z);

        for (let i = 0; i < 8; i++) {
            this.handles[i].position.copy(this.corners[i]);
        }

        const pos = this.lines.geometry.attributes.position.array;
        let idx = 0;
        const addLine = (c1, c2) => {
            pos[idx++] = c1.x; pos[idx++] = c1.y; pos[idx++] = c1.z;
            pos[idx++] = c2.x; pos[idx++] = c2.y; pos[idx++] = c2.z;
        };

        // Bottom edges
        addLine(this.corners[0], this.corners[1]);
        addLine(this.corners[1], this.corners[2]);
        addLine(this.corners[2], this.corners[3]);
        addLine(this.corners[3], this.corners[0]);

        // Top edges
        addLine(this.corners[4], this.corners[5]);
        addLine(this.corners[5], this.corners[6]);
        addLine(this.corners[6], this.corners[7]);
        addLine(this.corners[7], this.corners[4]);

        // Vertical edges
        addLine(this.corners[0], this.corners[4]);
        addLine(this.corners[1], this.corners[5]);
        addLine(this.corners[2], this.corners[6]);
        addLine(this.corners[3], this.corners[7]);

        this.lines.geometry.attributes.position.needsUpdate = true;
    }

    setHandleHighlight(index) {
        for (let i = 0; i < 8; i++) {
            const h = this.handles[i];
            if (i === index) {
                h.material.color.set(0xffff00);
                h.scale.set(1.25, 1.25, 1.25);
            } else {
                h.material.color.set(0x00f7ff);
                h.scale.set(1.0, 1.0, 1.0);
            }
        }
    }

    getHandleMeshes() {
        return this.handles;
    }

    hide() {
        this.target = null;
        this.group.visible = false;
        this.setHandleHighlight(-1);
    }
}

class FurnitureGameSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.orbitControls = null;

        // View Mode: 'FPS' (First Person View) or 'ORBIT'
        this.viewMode = 'FPS';

        // Player State
        this.playerPos = new THREE.Vector3(0, 1.7, 5);
        this.cameraYaw = 0;
        this.cameraPitch = 0;
        this.moveSpeed = 5.5;
        this.sprintSpeed = 10.0;
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprint: false
        };
        this.isPointerLocked = false;
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Maximum Reach / Interaction Distance (8.0 meters)
        this.MAX_REACH_DIST = 8.0;

        // Raycasting & Floor
        this.raycaster = new THREE.Raycaster();
        this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.planeIntersectPoint = new THREE.Vector3();
        this.handFloorIntersection = new THREE.Vector3();
        this.isHandFloorValid = false;

        // Furniture State - By Default NO asset is selected!
        this.activeFurnitureIndex = -1;
        this.selectedObject = null;
        this.hoveredObject = null;
        this.hoveredHandle = null;

        // Explicit Drag & Drop State
        this.isDraggingFromHotbar = false;
        this.draggedHotbarIndex = -1;
        this.isDraggingExisting = false;
        this.draggedObject = null;
        this.isResizingCorner = false;
        this.activeCornerIndex = -1;
        this.dragOffset = new THREE.Vector3();
        this.resizeInitialScale = 1.0;
        this.resizeInitialDist = 1.0;
        this.resizeInitialCenter = new THREE.Vector3();

        // Two-hand transform initial baselines
        this.twoHandBaseScale = 1.0;
        this.twoHandBaseRotationY = 0;

        this.placedObjects = [];
        this.furnitureModels = {};
        this.ghostPreviewMesh = null;
        this.idCounter = 1;
        this.cornerBoxHelper = null;

        this.lastFrameTime = performance.now();
        this._toastTimeout = null;
        this.gestureController = null;

        // Furniture Asset Catalog
        this.furnitureList = [
            { name: 'Gothic Commode', path: 'assets/GothicCommode_01_CC0', innerFolder: 'GothicCommode_01', icon: '🗄️' },
            { name: 'Lounge Chair', path: 'assets/mid_century_lounge_chair_CC0', innerFolder: 'mid_century_lounge_chair', icon: '🪑' },
            { name: 'Arm Chair', path: 'assets/modern_arm_chair_01_CC0', innerFolder: 'modern_arm_chair_01', icon: '🪑' },
            { name: 'Ottoman', path: 'assets/Ottoman_01_CC0', innerFolder: 'Ottoman_01', icon: '🛋️' },
            { name: 'Round Table', path: 'assets/round_wooden_table_01_CC0', innerFolder: 'round_wooden_table_01', icon: '⭕' },
            { name: 'Small Table', path: 'assets/small_wooden_table_01_CC0', innerFolder: 'small_wooden_table_01', icon: '📦' },
            { name: 'Sofa 1', path: 'assets/Sofa_01_CC0', innerFolder: 'Sofa_01', icon: '🛋️' },
            { name: 'Sofa 2', path: 'assets/sofa_02_CC0', innerFolder: 'sofa_02', icon: '🛋️' },
            { name: 'Sofa 3', path: 'assets/sofa_03_CC0', innerFolder: 'sofa_03', icon: '🛋️' },
            { name: 'Wooden Drawer', path: 'assets/vintage_wooden_drawer_01_CC0', innerFolder: 'vintage_wooden_drawer_01', icon: '🗄️' },
            { name: 'Wooden Table', path: 'assets/wooden_table_02_CC0', innerFolder: 'wooden_table_02', icon: '🪑' }
        ];

        this.init();
        this.setupEventListeners();
        this.loadAllFurniture();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x121620);
        this.scene.fog = new THREE.FogExp2(0x121620, 0.015);

        // Perspective Camera
        const canvas = document.getElementById('canvas');
        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            500
        );
        this.updateCameraTransform();

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
        sunLight.position.set(16, 26, 14);
        sunLight.castShadow = true;
        sunLight.shadow.camera.left = -30;
        sunLight.shadow.camera.right = 30;
        sunLight.shadow.camera.top = 30;
        sunLight.shadow.camera.bottom = -30;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 100;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);

        const hemiLight = new THREE.HemisphereLight(0x7fb3d5, 0x2c3e50, 0.45);
        this.scene.add(hemiLight);

        // Ground Floor Mesh (60m x 60m) - NO house model!
        const groundGeo = new THREE.PlaneGeometry(60, 60);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x1e2430,
            roughness: 0.8,
            metalness: 0.2
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.ground.name = 'floorPlaneMesh';
        this.scene.add(this.ground);

        // Visual Floor Grid
        const gridHelper = new THREE.GridHelper(60, 60, 0x00f7ff, 0x334155);
        gridHelper.position.y = 0.005;
        this.scene.add(gridHelper);

        // Sleek Corner Box Helper for selected furniture
        this.cornerBoxHelper = new SleekCornerBoxHelper(this.scene);

        // OrbitControls for TPP mode
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.06;
        this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.02;
        this.orbitControls.minDistance = 2.5;
        this.orbitControls.maxDistance = 60;
        this.orbitControls.enabled = false;

        // Ghost Placement Preview Hologram - Hidden by default!
        const ghostBoxGeo = new THREE.BoxGeometry(1, 1, 1);
        const ghostBoxMat = new THREE.MeshBasicMaterial({
            color: 0x00f7ff,
            transparent: true,
            opacity: 0.4,
            wireframe: false
        });
        this.ghostPreviewMesh = new THREE.Mesh(ghostBoxGeo, ghostBoxMat);
        this.ghostPreviewMesh.visible = false;
        this.scene.add(this.ghostPreviewMesh);

        // Initialize Two-Hand Gesture Controller
        this.initGestureController();

        // Start render loop
        this.animate();
    }

    updateCameraTransform() {
        if (this.viewMode === 'FPS') {
            this.camera.position.copy(this.playerPos);

            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.x = this.cameraPitch;
            euler.y = this.cameraYaw;
            this.camera.quaternion.setFromEuler(euler);
        }
    }

    toggleViewMode() {
        if (this.viewMode === 'FPS') {
            this.viewMode = 'ORBIT';
            this.orbitControls.enabled = true;
            this.orbitControls.target.set(this.playerPos.x, 0.5, this.playerPos.z);
            this.camera.position.set(this.playerPos.x + 8, 10, this.playerPos.z + 8);
            this.orbitControls.update();

            document.getElementById('view-mode-icon').textContent = '🌐';
            document.getElementById('view-mode-text').textContent = 'Orbit View (V)';
            document.getElementById('crosshair').style.display = 'none';
            document.getElementById('pointer-lock-prompt').style.display = 'none';
            this.showToast('Switched to Orbit View', 1000);
        } else {
            this.viewMode = 'FPS';
            this.orbitControls.enabled = false;
            this.updateCameraTransform();

            document.getElementById('view-mode-icon').textContent = '🚶';
            document.getElementById('view-mode-text').textContent = 'First Person (V)';
            document.getElementById('crosshair').style.display = 'block';
            document.getElementById('pointer-lock-prompt').style.display = 'block';
            this.showToast('Switched to First Person View', 1000);
        }
    }

    // =========================================================================
    // TWO-HAND GESTURE RECOGNITION & DRAG-AND-DROP
    // =========================================================================

    initGestureController() {
        this.gestureController = new HandGestureController();

        // 1. OPEN HAND -> MOVE CURSOR
        this.gestureController.onPointerMove = (pointer, ndc, hoveredElem) => {
            this.handlePointerMove(pointer, ndc, hoveredElem);
        };

        // 2. PINCH START -> GRAB / PICK UP / START DRAG
        this.gestureController.onPinchStart = (ndc, data) => {
            this.handlePinchStart(ndc, data);
        };

        // 3. PINCH MOVE -> DRAG
        this.gestureController.onPinchMove = (ndc, data) => {
            this.handlePinchMove(ndc, data);
        };

        // 4. PINCH END -> DROP / PLACE
        this.gestureController.onPinchEnd = (ndc, data) => {
            this.handlePinchEnd(ndc, data);
        };

        // 5. TWO-HAND PINCH -> RESIZE (apart/together) & ROTATE (around each other)
        this.gestureController.onTwoHandTransform = (transform) => {
            this.handleTwoHandTransform(transform);
        };

        // 6. CLOSED FIST -> CANCEL
        this.gestureController.onCancel = () => {
            this.handleGestureCancel();
        };

        this.gestureController.start();
    }

    getPlacedObjectFromMesh(mesh) {
        let cur = mesh;
        while (cur) {
            if (this.placedObjects.includes(cur)) return cur;
            cur = cur.parent;
        }
        return null;
    }

    getHotbarSlotAt(screenX, screenY, hoveredElem = null) {
        if (hoveredElem) {
            const slot = hoveredElem.classList?.contains('hotbar-slot')
                ? hoveredElem
                : hoveredElem.closest?.('.hotbar-slot');
            if (slot) return slot;
        }

        const hotbar = document.getElementById('hotbar');
        if (!hotbar) return null;

        const rect = hotbar.getBoundingClientRect();
        // Generous vertical and horizontal buffer around hotbar (30px padding)
        if (
            screenY >= rect.top - 25 &&
            screenY <= rect.bottom + 25 &&
            screenX >= rect.left - 20 &&
            screenX <= rect.right + 20
        ) {
            const slots = Array.from(document.querySelectorAll('.hotbar-slot'));
            let minDist = Infinity;
            let closestSlot = null;

            for (const s of slots) {
                const sRect = s.getBoundingClientRect();
                const cx = sRect.left + sRect.width / 2;
                const cy = sRect.top + sRect.height / 2;
                const dist = Math.hypot(screenX - cx, screenY - cy);
                if (dist < minDist) {
                    minDist = dist;
                    closestSlot = s;
                }
            }

            if (closestSlot && minDist < 75) {
                return closestSlot;
            }
        }
        return null;
    }

    isOverDustbin(screenX, screenY) {
        const bin = document.getElementById('dustbin-container');
        if (!bin) return false;
        const rect = bin.getBoundingClientRect();
        // Generous hit-box with 25px margin for effortless dropping
        return (
            screenX >= rect.left - 25 &&
            screenX <= rect.right + 25 &&
            screenY >= rect.top - 25 &&
            screenY <= rect.bottom + 25
        );
    }

    triggerDustbinSuccessAnimation() {
        const bin = document.getElementById('dustbin-container');
        if (!bin) return;
        bin.classList.remove('dustbin-crunch', 'drag-over', 'drag-active');
        void bin.offsetWidth; // Force CSS reflow
        bin.classList.add('dustbin-crunch');
        setTimeout(() => bin.classList.remove('dustbin-crunch'), 600);
    }

    // 1. Open hand: Cursor follows index fingertip / palm position
    handlePointerMove(pointer, ndc, hoveredElem) {
        const screenX = pointer.x * window.innerWidth;
        const screenY = pointer.y * window.innerHeight;

        // Dustbin hover state update during drag
        const binEl = document.getElementById('dustbin-container');
        if (binEl) {
            if (this.isDraggingExisting || this.isDraggingFromHotbar) {
                binEl.classList.add('drag-active');
                if (this.isOverDustbin(screenX, screenY)) {
                    binEl.classList.add('drag-over');
                    if (this.ghostPreviewMesh) this.ghostPreviewMesh.visible = false;
                    this.hoveredHandle = null;
                    this.hoveredObject = null;
                    this.isHandFloorValid = false;
                    if (this.gestureController) {
                        this.gestureController.updateStatus('🗑️ Over Trash Bin', 'Release pinch to DELETE object', 'status-error');
                    }
                    return;
                } else {
                    binEl.classList.remove('drag-over');
                }
            } else {
                binEl.classList.remove('drag-active', 'drag-over');
            }
        }

        // A. Highlight hovered hotbar slot
        const slot = this.getHotbarSlotAt(screenX, screenY, hoveredElem);
        document.querySelectorAll('.hotbar-slot.gesture-hover').forEach(s => {
            if (s !== slot) s.classList.remove('gesture-hover');
        });

        if (slot) {
            slot.classList.add('gesture-hover');
            this.hoveredHandle = null;
            this.hoveredObject = null;
            this.isHandFloorValid = false;
            return;
        }

        // B. Raycast from hand NDC
        this.raycaster.setFromCamera(ndc, this.camera);

        // Check corner handles if an object is selected and in reach
        if (this.selectedObject && this.cornerBoxHelper) {
            const distToSel = this.playerPos.distanceTo(this.selectedObject.position);
            if (distToSel <= this.MAX_REACH_DIST) {
                const handleHits = this.raycaster.intersectObjects(this.cornerBoxHelper.getHandleMeshes(), false);
                if (handleHits.length > 0) {
                    const handle = handleHits[0].object;
                    this.hoveredHandle = handle;
                    this.cornerBoxHelper.setHandleHighlight(handle.userData.cornerIndex);
                    this.hoveredObject = null;
                    return;
                }
            }
            this.hoveredHandle = null;
            this.cornerBoxHelper.setHandleHighlight(-1);
        }

        // Check placed furniture within reach distance (MAX_REACH_DIST = 8m)
        const furnitureHits = this.raycaster.intersectObjects(this.placedObjects, true);
        if (furnitureHits.length > 0) {
            const rootObj = this.getPlacedObjectFromMesh(furnitureHits[0].object);
            if (rootObj) {
                const dist = this.playerPos.distanceTo(rootObj.position);
                if (dist <= this.MAX_REACH_DIST) {
                    this.hoveredObject = rootObj;
                    return;
                }
            }
        }
        this.hoveredObject = null;

        // Raycast against floor plane
        if (this.raycaster.ray.intersectPlane(this.floorPlane, this.planeIntersectPoint)) {
            const dist = this.playerPos.distanceTo(this.planeIntersectPoint);
            // Valid only within reach distance
            if (dist <= this.MAX_REACH_DIST) {
                this.isHandFloorValid = true;
                this.handFloorIntersection.copy(this.planeIntersectPoint);

                // Update ghost preview if currently dragging from hotbar
                if (this.isDraggingFromHotbar && this.ghostPreviewMesh) {
                    this.ghostPreviewMesh.position.set(
                        this.planeIntersectPoint.x,
                        this.ghostPreviewMesh.geometry.parameters.height / 2,
                        this.planeIntersectPoint.z
                    );
                    this.ghostPreviewMesh.rotation.y = this.cameraYaw;
                    this.ghostPreviewMesh.visible = true;
                }
                return;
            }
        }

        this.isHandFloorValid = false;
        if (this.isDraggingFromHotbar && this.ghostPreviewMesh) {
            this.ghostPreviewMesh.visible = false;
        }
    }

    // 2. Pinch Start
    handlePinchStart(ndc, data) {
        const screenX = data.screenPos ? data.screenPos.x : (data.pointer.x * window.innerWidth);
        const screenY = data.screenPos ? data.screenPos.y : (data.pointer.y * window.innerHeight);

        // A. Pinched a Hotbar slot? -> Select it & start dragging onto floor!
        const slot = this.getHotbarSlotAt(screenX, screenY, data.hoveredElem);
        if (slot && slot.dataset.index !== undefined) {
            const idx = parseInt(slot.dataset.index);
            this.selectHotbarSlot(idx);
            this.isDraggingFromHotbar = true;
            this.draggedHotbarIndex = idx;
            this.deselectObject();
            this.showToast(`Selected ${this.furnitureList[idx].name} • Drag to floor`, 1200);
            return;
        }

        this.raycaster.setFromCamera(ndc, this.camera);

        // B. Pinched a Corner Handle? -> Resize!
        if (this.selectedObject && this.cornerBoxHelper) {
            const distToSel = this.playerPos.distanceTo(this.selectedObject.position);
            if (distToSel <= this.MAX_REACH_DIST) {
                const handleHits = this.raycaster.intersectObjects(this.cornerBoxHelper.getHandleMeshes(), false);
                if (handleHits.length > 0) {
                    const handle = handleHits[0].object;
                    this.isResizingCorner = true;
                    this.activeCornerIndex = handle.userData.cornerIndex;
                    this.cornerBoxHelper.setHandleHighlight(this.activeCornerIndex);

                    this.resizeInitialScale = this.selectedObject.scale.x;
                    this.resizeInitialCenter.copy(this.selectedObject.position);

                    const cornerPos = handle.position;
                    this.resizeInitialDist = Math.max(0.15, Math.hypot(cornerPos.x - this.resizeInitialCenter.x, cornerPos.z - this.resizeInitialCenter.z));

                    this.showToast('Pull corner to resize', 1000);
                    return;
                }
            }
        }

        // C. Pinched existing placed furniture within reach? -> Pick it up & drag!
        const furnitureHits = this.raycaster.intersectObjects(this.placedObjects, true);
        if (furnitureHits.length > 0) {
            const rootObj = this.getPlacedObjectFromMesh(furnitureHits[0].object);
            if (rootObj) {
                const dist = this.playerPos.distanceTo(rootObj.position);
                if (dist <= this.MAX_REACH_DIST) {
                    this.selectObject(rootObj);
                    this.isDraggingExisting = true;
                    this.draggedObject = rootObj;

                    if (this.raycaster.ray.intersectPlane(this.floorPlane, this.planeIntersectPoint)) {
                        this.dragOffset.x = rootObj.position.x - this.planeIntersectPoint.x;
                        this.dragOffset.z = rootObj.position.z - this.planeIntersectPoint.z;
                    } else {
                        this.dragOffset.set(0, 0, 0);
                    }

                    this.showToast(`Moving: ${rootObj.userData.furnitureType}`, 1000);
                    return;
                } else {
                    this.showToast('Too far away - walk closer (WASD)', 1200);
                    return;
                }
            }
        }

        // D. Pinched empty space/floor -> Deselect
        if (this.selectedObject) {
            this.deselectObject();
        }
    }

    // 3. Pinch Move
    handlePinchMove(ndc, data) {
        this.raycaster.setFromCamera(ndc, this.camera);

        if (this.raycaster.ray.intersectPlane(this.floorPlane, this.planeIntersectPoint)) {
            const dist = this.playerPos.distanceTo(this.planeIntersectPoint);

            // A. Pulling corner handle to resize object
            if (this.isResizingCorner && this.selectedObject) {
                const curDist = Math.hypot(this.planeIntersectPoint.x - this.resizeInitialCenter.x, this.planeIntersectPoint.z - this.resizeInitialCenter.z);
                const scaleMultiplier = curDist / this.resizeInitialDist;
                let newScale = this.resizeInitialScale * scaleMultiplier;
                newScale = THREE.MathUtils.clamp(newScale, 0.35, 4.0);
                newScale = Math.round(newScale * 10) / 10;

                this.selectedObject.scale.set(newScale, newScale, newScale);
                this.updateYOffsetForObject(this.selectedObject);
                this.cornerBoxHelper.update();
                this.cornerBoxHelper.setHandleHighlight(this.activeCornerIndex);
                this.updateObjectData(this.selectedObject);
                return;
            }

            // B. Dragging existing placed furniture (clamp to reach distance)
            if (this.isDraggingExisting && this.draggedObject) {
                if (dist <= this.MAX_REACH_DIST + 1.5) {
                    this.draggedObject.position.x = this.planeIntersectPoint.x + this.dragOffset.x;
                    this.draggedObject.position.z = this.planeIntersectPoint.z + this.dragOffset.z;
                    this.cornerBoxHelper.update();
                    this.updateObjectData(this.draggedObject);
                }
                return;
            }

            // C. Dragging ghost placement preview from hotbar
            if (this.isDraggingFromHotbar && this.ghostPreviewMesh) {
                if (dist <= this.MAX_REACH_DIST) {
                    this.ghostPreviewMesh.position.x = this.planeIntersectPoint.x;
                    this.ghostPreviewMesh.position.z = this.planeIntersectPoint.z;
                    this.ghostPreviewMesh.visible = true;
                } else {
                    this.ghostPreviewMesh.visible = false;
                }
                return;
            }
        }
    }

    // 4. Pinch End: Drop / Place ONLY on explicit release of drag
    handlePinchEnd(ndc, data) {
        const screenX = data.screenPos ? data.screenPos.x : (data.pointer.x * window.innerWidth);
        const screenY = data.screenPos ? data.screenPos.y : (data.pointer.y * window.innerHeight);

        const binEl = document.getElementById('dustbin-container');
        if (binEl) {
            binEl.classList.remove('drag-active', 'drag-over');
        }

        // A. TRASH BASKET DROP: Drop object here to DELETE!
        if (this.isOverDustbin(screenX, screenY)) {
            if (this.isDraggingExisting && this.draggedObject) {
                const doomedObj = this.draggedObject;
                this.isDraggingExisting = false;
                this.draggedObject = null;
                this.deleteSelectedObject(doomedObj);
                this.triggerDustbinSuccessAnimation();
                return;
            }
            if (this.isDraggingFromHotbar) {
                this.isDraggingFromHotbar = false;
                this.draggedHotbarIndex = -1;
                if (this.ghostPreviewMesh) this.ghostPreviewMesh.visible = false;
                this.triggerDustbinSuccessAnimation();
                this.showToast('🗑️ Placement canceled & discarded', 1200);
                return;
            }
        }

        // B. Finish corner resize
        if (this.isResizingCorner && this.selectedObject) {
            this.isResizingCorner = false;
            this.activeCornerIndex = -1;
            this.cornerBoxHelper.setHandleHighlight(-1);
            this.showToast(`📐 Resized: ${this.selectedObject.scale.x.toFixed(1)}x`, 1200);
            return;
        }

        // C. Finish dragging existing furniture
        if (this.isDraggingExisting && this.draggedObject) {
            this.isDraggingExisting = false;
            const name = this.draggedObject.userData.furnitureType;
            this.showToast(`Placed ${name}`, 1200);
            this.updateObjectData(this.draggedObject);
            this.draggedObject = null;
            return;
        }

        // D. Drop / Place furniture from hotbar onto floor!
        if (this.isDraggingFromHotbar) {
            this.isDraggingFromHotbar = false;
            if (this.ghostPreviewMesh) this.ghostPreviewMesh.visible = false;

            this.raycaster.setFromCamera(ndc, this.camera);
            if (this.raycaster.ray.intersectPlane(this.floorPlane, this.planeIntersectPoint)) {
                const dist = this.playerPos.distanceTo(this.planeIntersectPoint);
                if (dist <= this.MAX_REACH_DIST) {
                    const spawned = this.placeFurnitureAtLocation(this.planeIntersectPoint.x, this.planeIntersectPoint.z, this.draggedHotbarIndex);
                    if (spawned) {
                        this.selectObject(spawned);
                        this.showToast(`Dropped & Placed: ${spawned.userData.furnitureType}!`, 1600);
                    }
                } else {
                    this.showToast('Too far away - walk closer (WASD)', 1400);
                }
            }
            this.draggedHotbarIndex = -1;
            return;
        }
    }

    // 5. Two-hand pinch: Resize & Rotate
    handleTwoHandTransform({ scaleMultiplier, deltaAngle }) {
        if (!this.selectedObject) {
            if (this.placedObjects.length > 0) {
                const nearest = this.placedObjects[this.placedObjects.length - 1];
                if (this.playerPos.distanceTo(nearest.position) <= this.MAX_REACH_DIST) {
                    this.selectObject(nearest);
                } else {
                    return;
                }
            } else {
                return;
            }
        }

        // Resize
        let newScale = this.twoHandBaseScale * scaleMultiplier;
        newScale = THREE.MathUtils.clamp(newScale, 0.35, 4.0);
        newScale = Math.round(newScale * 10) / 10;
        this.selectedObject.scale.set(newScale, newScale, newScale);
        this.updateYOffsetForObject(this.selectedObject);

        // Rotate
        this.selectedObject.rotation.y = this.twoHandBaseRotationY + (deltaAngle * 1.6);

        this.cornerBoxHelper.update();
        this.updateObjectData(this.selectedObject);
    }

    // 6. Closed fist: Cancel
    handleGestureCancel() {
        const binEl = document.getElementById('dustbin-container');
        if (binEl) binEl.classList.remove('drag-active', 'drag-over');

        if (this.isResizingCorner && this.selectedObject) {
            this.selectedObject.scale.set(this.resizeInitialScale, this.resizeInitialScale, this.resizeInitialScale);
            this.updateYOffsetForObject(this.selectedObject);
            this.cornerBoxHelper.update();
            this.isResizingCorner = false;
            this.activeCornerIndex = -1;
            this.showToast('✊ Canceled Resize', 1000);
            return;
        }

        if (this.isDraggingExisting) {
            this.isDraggingExisting = false;
            this.draggedObject = null;
            this.showToast('✊ Canceled Move', 1000);
            return;
        }

        if (this.isDraggingFromHotbar) {
            this.isDraggingFromHotbar = false;
            this.draggedHotbarIndex = -1;
            if (this.ghostPreviewMesh) this.ghostPreviewMesh.visible = false;
            this.showToast('✊ Canceled Placement', 1000);
            return;
        }

        if (this.selectedObject) {
            this.deselectObject();
            this.showToast('✊ Deselected', 1000);
        }
    }

    // =========================================================================
    // MINECRAFT HOTBAR & ASSET MANAGEMENT
    // =========================================================================

    createHotbar() {
        const hotbar = document.getElementById('hotbar');
        if (!hotbar) return;
        hotbar.innerHTML = '';

        this.furnitureList.forEach((item, index) => {
            const slot = document.createElement('div');
            // By default, NO slot is active!
            slot.className = `hotbar-slot ${index === this.activeFurnitureIndex ? 'active' : ''}`;
            slot.dataset.index = index;

            // Slot number 1-9
            const numberLabel = document.createElement('span');
            numberLabel.className = 'slot-number';
            numberLabel.textContent = `${index + 1}`;

            // Emoji / Icon
            const icon = document.createElement('div');
            icon.className = 'slot-icon';
            icon.textContent = item.icon;

            // Name label
            const label = document.createElement('span');
            label.className = 'slot-label';
            label.textContent = item.name.split(' ')[0];

            slot.appendChild(numberLabel);
            slot.appendChild(icon);
            slot.appendChild(label);

            // Direct mouse click / touch selection
            const onSelectSlot = (e) => {
                e.stopPropagation();
                this.selectHotbarSlot(index);
                this.isDraggingFromHotbar = true;
                this.draggedHotbarIndex = index;
                this.deselectObject();
                this.showToast(`Selected ${item.name} • Drag to floor`, 1000);
            };
            slot.addEventListener('pointerdown', onSelectSlot);
            slot.addEventListener('click', onSelectSlot);

            hotbar.appendChild(slot);
        });

        this.updateHotbarTooltip();
    }

    selectHotbarSlot(index) {
        this.activeFurnitureIndex = index;

        document.querySelectorAll('.hotbar-slot').forEach((slot, i) => {
            if (i === index) slot.classList.add('active');
            else slot.classList.remove('active');
        });

        this.updateHotbarTooltip();
        this.updateGhostPreviewMesh();
    }

    updateHotbarTooltip() {
        const tooltip = document.getElementById('hotbar-item-tooltip');
        if (!tooltip) return;

        if (this.activeFurnitureIndex === -1) {
            tooltip.innerHTML = `Pinch an asset below to select & drag onto floor`;
        } else {
            const item = this.furnitureList[this.activeFurnitureIndex];
            tooltip.innerHTML = `Holding: <span class="highlight">${item.name}</span> • Drag onto floor & release to drop`;
        }
    }

    updateGhostPreviewMesh() {
        if (this.activeFurnitureIndex === -1) {
            if (this.ghostPreviewMesh) this.ghostPreviewMesh.visible = false;
            return;
        }
        const item = this.furnitureList[this.activeFurnitureIndex];
        const model = this.furnitureModels[item.name];
        if (!model) return;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        this.ghostPreviewMesh.geometry.dispose();
        this.ghostPreviewMesh.geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    }

    placeFurnitureAtLocation(x, z, overrideIndex = -1) {
        const targetIdx = overrideIndex !== -1 ? overrideIndex : this.activeFurnitureIndex;
        if (targetIdx === -1) return null;

        const item = this.furnitureList[targetIdx];
        const model = this.furnitureModels[item.name];
        if (!model) {
            this.showToast(`Loading ${item.name}...`, 1000);
            return null;
        }

        const clampedX = Math.max(-27, Math.min(27, x));
        const clampedZ = Math.max(-27, Math.min(27, z));

        const clone = model.clone(true);
        const box = new THREE.Box3().setFromObject(clone);
        const yOffset = -box.min.y;

        clone.position.set(clampedX, yOffset, clampedZ);
        clone.rotation.y = this.cameraYaw;

        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const uniqueId = `furniture_${item.name.toLowerCase().replace(/\s+/g, '_')}_${this.idCounter++}`;
        clone.userData = {
            id: uniqueId,
            furnitureType: item.name,
            yOffset: yOffset
        };

        this.scene.add(clone);
        this.placedObjects.push(clone);

        return clone;
    }

    updateYOffsetForObject(object) {
        const baseBox = new THREE.Box3().setFromObject(object);
        const yOffset = -baseBox.min.y + object.position.y;
        object.userData.yOffset = yOffset;
        object.position.y = yOffset;
    }

    // =========================================================================
    // SELECTION & EDITING
    // =========================================================================

    selectObject(object) {
        if (!object) return;
        this.selectedObject = object;

        if (this.cornerBoxHelper) {
            this.cornerBoxHelper.setFromObject(object);
        }

        this.twoHandBaseScale = object.scale.x;
        this.twoHandBaseRotationY = object.rotation.y;

        const panel = document.getElementById('control-panel');
        if (panel) {
            panel.classList.add('visible');
            const rotY = document.getElementById('rotation-y');
            const rotVal = document.getElementById('rotation-value');
            if (rotY && rotVal) {
                const deg = Math.round(THREE.MathUtils.radToDeg(object.rotation.y)) % 360;
                rotY.value = deg < 0 ? deg + 360 : deg;
                rotVal.textContent = `${rotY.value}°`;
            }
            const scaleSlider = document.getElementById('scale-slider');
            const scaleVal = document.getElementById('scale-value');
            if (scaleSlider && scaleVal) {
                scaleSlider.value = object.scale.x;
                scaleVal.textContent = object.scale.x.toFixed(1);
            }
        }
    }

    deselectObject() {
        this.selectedObject = null;
        if (this.cornerBoxHelper) this.cornerBoxHelper.hide();
        const panel = document.getElementById('control-panel');
        if (panel) panel.classList.remove('visible');
    }

    deleteSelectedObject(target = null) {
        const objToDelete = target || this.selectedObject;
        if (!objToDelete) return;
        const index = this.placedObjects.indexOf(objToDelete);
        if (index > -1) {
            this.placedObjects.splice(index, 1);
        }
        this.scene.remove(objToDelete);
        if (this.selectedObject === objToDelete) {
            this.deselectObject();
        }
        const name = objToDelete.userData?.furnitureType || 'Object';
        this.showToast(`🗑️ Deleted: ${name}`, 1200);
    }

    duplicateSelectedObject() {
        if (!this.selectedObject) return;
        const itemType = this.selectedObject.userData.furnitureType;
        const model = this.furnitureModels[itemType];
        if (!model) return;

        const clone = model.clone(true);
        clone.position.copy(this.selectedObject.position);
        clone.position.x += 1.2;
        clone.position.z += 1.2;
        clone.rotation.copy(this.selectedObject.rotation);
        clone.scale.copy(this.selectedObject.scale);

        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        clone.userData = {
            id: `furniture_${itemType.toLowerCase().replace(/\s+/g, '_')}_${this.idCounter++}`,
            furnitureType: itemType,
            yOffset: this.selectedObject.userData.yOffset
        };

        this.scene.add(clone);
        this.placedObjects.push(clone);
        this.selectObject(clone);
        this.showToast('📋 Duplicated', 1000);
    }

    rotateSelectedObject(degrees = 90) {
        if (!this.selectedObject) return;
        this.selectedObject.rotation.y = (this.selectedObject.rotation.y + THREE.MathUtils.degToRad(degrees)) % (Math.PI * 2);
        this.cornerBoxHelper.update();
        this.updateObjectData(this.selectedObject);
    }

    updateObjectData(object) {
        if (!object) return;
        if (this.cornerBoxHelper) this.cornerBoxHelper.update();

        const rotY = document.getElementById('rotation-y');
        const rotVal = document.getElementById('rotation-value');
        if (rotY && rotVal) {
            const deg = Math.round(THREE.MathUtils.radToDeg(object.rotation.y)) % 360;
            rotY.value = deg < 0 ? deg + 360 : deg;
            rotVal.textContent = `${rotY.value}°`;
        }

        const scaleSlider = document.getElementById('scale-slider');
        const scaleVal = document.getElementById('scale-value');
        if (scaleSlider && scaleVal) {
            scaleSlider.value = object.scale.x;
            scaleVal.textContent = object.scale.x.toFixed(1);
        }
    }

    // =========================================================================
    // MODEL & ASSET LOADERS (NO House Model)
    // =========================================================================

    async loadAllFurniture() {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        loader.setDRACOLoader(dracoLoader);

        const loadingEl = document.getElementById('loading');
        let loaded = 0;

        for (const item of this.furnitureList) {
            try {
                const glbPath = `${item.path}/${item.innerFolder}/${item.innerFolder}.glb`;
                const gltf = await new Promise((resolve, reject) => {
                    loader.load(glbPath, resolve, undefined, reject);
                });
                this.furnitureModels[item.name] = gltf.scene;
                loaded++;
            } catch (e) {
                console.warn(`Could not load ${item.name}`, e);
            }
        }

        if (loadingEl) loadingEl.style.display = 'none';

        this.createHotbar();
        console.log(`✅ Loaded ${loaded}/${this.furnitureList.length} 3D furniture models`);
    }

    // =========================================================================
    // EVENT LISTENERS & INPUT CONTROLS
    // =========================================================================

    setupEventListeners() {
        const canvas = this.renderer.domElement;

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Pointer Lock & Mouse Look
        const promptEl = document.getElementById('pointer-lock-prompt');
        if (promptEl) {
            promptEl.addEventListener('click', () => {
                canvas.requestPointerLock();
            });
        }

        canvas.addEventListener('click', (e) => {
            const mouseNDC = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );
            this.raycaster.setFromCamera(mouseNDC, this.camera);

            // 1. Check corner handle hits if selected
            if (this.selectedObject && this.cornerBoxHelper) {
                const distToSel = this.playerPos.distanceTo(this.selectedObject.position);
                if (distToSel <= this.MAX_REACH_DIST) {
                    const handleHits = this.raycaster.intersectObjects(this.cornerBoxHelper.getHandleMeshes(), false);
                    if (handleHits.length > 0) {
                        return;
                    }
                }
            }

            // 2. Check furniture hits
            const hits = this.raycaster.intersectObjects(this.placedObjects, true);
            if (hits.length > 0) {
                const rootObj = this.getPlacedObjectFromMesh(hits[0].object);
                if (rootObj) {
                    const dist = this.playerPos.distanceTo(rootObj.position);
                    if (dist <= this.MAX_REACH_DIST) {
                        this.selectObject(rootObj);
                        return;
                    } else {
                        this.showToast('Too far away - walk closer (WASD)', 1000);
                        return;
                    }
                }
            }

            // 3. If dragging or holding hotbar item, place on floor
            if (this.isDraggingFromHotbar || this.activeFurnitureIndex !== -1) {
                if (this.raycaster.ray.intersectPlane(this.floorPlane, this.planeIntersectPoint)) {
                    const dist = this.playerPos.distanceTo(this.planeIntersectPoint);
                    if (dist <= this.MAX_REACH_DIST) {
                        const targetIdx = this.draggedHotbarIndex !== -1 ? this.draggedHotbarIndex : this.activeFurnitureIndex;
                        const spawned = this.placeFurnitureAtLocation(this.planeIntersectPoint.x, this.planeIntersectPoint.z, targetIdx);
                        if (spawned) {
                            this.selectObject(spawned);
                            this.isDraggingFromHotbar = false;
                            this.showToast(`Placed: ${spawned.userData.furnitureType}!`, 1200);
                            return;
                        }
                    } else {
                        this.showToast('Too far away - walk closer (WASD)', 1200);
                        return;
                    }
                }
            }

            // 4. Clicked empty space -> deselect or lock pointer
            if (this.selectedObject) {
                this.deselectObject();
            } else if (this.viewMode === 'FPS' && !this.isPointerLocked) {
                canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = (document.pointerLockElement === canvas);
            if (promptEl) {
                promptEl.style.display = this.isPointerLocked ? 'none' : 'block';
            }
        });

        // Dustbin Basket Click / Drop Event
        const dustbinEl = document.getElementById('dustbin-container');
        if (dustbinEl) {
            dustbinEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.selectedObject) {
                    const doomed = this.selectedObject;
                    this.deleteSelectedObject(doomed);
                    this.triggerDustbinSuccessAnimation();
                } else if (this.isDraggingFromHotbar || this.activeFurnitureIndex !== -1) {
                    this.isDraggingFromHotbar = false;
                    this.activeFurnitureIndex = -1;
                    this.selectHotbarSlot(-1);
                    this.triggerDustbinSuccessAnimation();
                    this.showToast('🗑️ Cleared selection', 1000);
                } else {
                    this.showToast('🗑️ Drag & drop any object here to delete', 1500);
                }
            });

            dustbinEl.addEventListener('pointerenter', () => {
                if (this.isDraggingExisting || this.isDraggingFromHotbar) {
                    dustbinEl.classList.add('drag-over');
                }
            });

            dustbinEl.addEventListener('pointerleave', () => {
                dustbinEl.classList.remove('drag-over');
            });
        }

        // Mouse Drag / Look
        window.addEventListener('mousedown', (e) => {
            if (e.target.closest('#hotbar-container') || e.target.closest('#dustbin-container') || e.target.closest('#game-top-bar') || e.target.closest('#gesture-pip-container') || e.target.closest('#control-panel')) {
                return;
            }
            this.isMouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
            if (this.isOverDustbin(e.clientX, e.clientY)) {
                if (this.isDraggingExisting && this.draggedObject) {
                    const doomed = this.draggedObject;
                    this.isDraggingExisting = false;
                    this.draggedObject = null;
                    this.deleteSelectedObject(doomed);
                    this.triggerDustbinSuccessAnimation();
                    return;
                }
                if (this.isDraggingFromHotbar) {
                    this.isDraggingFromHotbar = false;
                    this.draggedHotbarIndex = -1;
                    if (this.ghostPreviewMesh) this.ghostPreviewMesh.visible = false;
                    this.triggerDustbinSuccessAnimation();
                    this.showToast('🗑️ Placement canceled & discarded', 1200);
                    return;
                }
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.viewMode === 'FPS') {
                const sensitivity = 0.0022;

                if (this.isPointerLocked) {
                    this.cameraYaw -= e.movementX * sensitivity;
                    this.cameraPitch -= e.movementY * sensitivity;
                    this.cameraPitch = Math.max(-1.45, Math.min(1.45, this.cameraPitch));
                    this.updateCameraTransform();
                } else if (this.isMouseDown) {
                    const dx = e.clientX - this.lastMouseX;
                    const dy = e.clientY - this.lastMouseY;
                    this.lastMouseX = e.clientX;
                    this.lastMouseY = e.clientY;

                    this.cameraYaw -= dx * sensitivity * 1.5;
                    this.cameraPitch -= dy * sensitivity * 1.5;
                    this.cameraPitch = Math.max(-1.45, Math.min(1.45, this.cameraPitch));
                    this.updateCameraTransform();
                }
            }
        });

        // Keyboard Controls: WASD Walking, V for view mode
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

            // WASD Walking
            if (e.code === 'KeyW') this.keys.forward = true;
            if (e.code === 'KeyS') this.keys.backward = true;
            if (e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = true;

            // Hotbar Keys: 1 through 9
            if (e.key >= '1' && e.key <= '9') {
                const slotIdx = parseInt(e.key) - 1;
                this.selectHotbarSlot(slotIdx);
            }

            // V: Toggle View Mode (First Person / Orbit)
            if (e.code === 'KeyV') {
                this.toggleViewMode();
            }

            // DEL: Delete selected
            if (e.code === 'Delete' || e.code === 'Backspace') {
                this.deleteSelectedObject();
            }

            // ESC: Deselect
            if (e.code === 'Escape') {
                this.deselectObject();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW') this.keys.forward = false;
            if (e.code === 'KeyS') this.keys.backward = false;
            if (e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = false;
        });

        // Top Bar Buttons
        document.getElementById('view-mode-toggle')?.addEventListener('click', () => this.toggleViewMode());

        // Control Panel Buttons
        document.getElementById('delete-btn')?.addEventListener('click', () => this.deleteSelectedObject());
        document.getElementById('duplicate-btn')?.addEventListener('click', () => this.duplicateSelectedObject());
        document.getElementById('rotate-90-btn')?.addEventListener('click', () => this.rotateSelectedObject(90));

        // Control Panel Sliders
        const rotSlider = document.getElementById('rotation-y');
        if (rotSlider) {
            rotSlider.addEventListener('input', (e) => {
                if (this.selectedObject) {
                    const deg = parseFloat(e.target.value);
                    this.selectedObject.rotation.y = THREE.MathUtils.degToRad(deg);
                    document.getElementById('rotation-value').textContent = `${deg}°`;
                    this.updateObjectData(this.selectedObject);
                }
            });
        }

        const scaleSlider = document.getElementById('scale-slider');
        if (scaleSlider) {
            scaleSlider.addEventListener('input', (e) => {
                if (this.selectedObject) {
                    const s = parseFloat(e.target.value);
                    this.selectedObject.scale.set(s, s, s);
                    this.updateYOffsetForObject(this.selectedObject);
                    document.getElementById('scale-value').textContent = s.toFixed(1);
                    this.updateObjectData(this.selectedObject);
                }
            });
        }
    }

    // =========================================================================
    // GAME LOOP & ANIMATION
    // =========================================================================

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = now;

        // 1. WASD Movement (Player movement is purely via WASD keys)
        if (this.viewMode === 'FPS') {
            const currentSpeed = this.keys.sprint ? this.sprintSpeed : this.moveSpeed;
            const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
            const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

            let moveDir = new THREE.Vector3();
            if (this.keys.forward) moveDir.add(forward);
            if (this.keys.backward) moveDir.sub(forward);
            if (this.keys.left) moveDir.sub(right);
            if (this.keys.right) moveDir.add(right);

            if (moveDir.lengthSq() > 0) {
                moveDir.normalize();
                this.playerPos.addScaledVector(moveDir, currentSpeed * delta);
                this.playerPos.x = Math.max(-27, Math.min(27, this.playerPos.x));
                this.playerPos.z = Math.max(-27, Math.min(27, this.playerPos.z));
            }

            this.updateCameraTransform();
        } else {
            this.orbitControls.update();
        }

        this.renderer.render(this.scene, this.camera);
    }

    showToast(msg, duration = 1500) {
        const toast = document.getElementById('confirmation-toast');
        if (toast) {
            toast.textContent = msg;
            toast.classList.add('show');
            clearTimeout(this._toastTimeout);
            this._toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }
    }
}

// Start Game System
const game = new FurnitureGameSystem();
