/**
 * environment.js — Realistic & Optimized Outdoor Environment for Floorplan-to-3D
 * 
 * Features:
 * - Large procedural terrain with flat residential plot for the house
 * - Shrunk environment elements (trees, rocks, driveway) so the house looks large and prominent
 * - Natural tree scale (2.2m - 3.8m) matching residential wall height (1.35m)
 * - Deep dark blue to azure sky gradient dome that never washes out to white at midday
 * - Dynamic atmospheric lighting, sun corona, golden hour, and twilight
 * - Property plot guide boundary markers
 * - Optimized walk-around camera presets
 * - Frustum culling and shared materials for 60fps performance
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scaled constants — scaled so the house model looks big, prominent, and natural
const TERRAIN_SIZE = 650;
const TERRAIN_SEGMENTS = 130;
const PLOT_CLEAR_RADIUS = 10.5; // ~21m diameter clearing, perfectly sized for house & yard
const TREE_MIN_RADIUS = 12.0;   // Trees start naturally around the yard perimeter

export class OutdoorEnvironment {
  constructor(scene, renderer, camera) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;

    this.enabled = false;
    this.group = new THREE.Group();
    this.group.name = 'OutdoorEnvironmentGroup';
    this.group.visible = false;
    this.scene.add(this.group);

    // Sub-groups
    this.terrainGroup = new THREE.Group();
    this.vegetationGroup = new THREE.Group();
    this.plotGuideGroup = new THREE.Group();
    this.lightsGroup = new THREE.Group();

    this.group.add(this.terrainGroup);
    this.group.add(this.vegetationGroup);
    this.group.add(this.plotGuideGroup);
    this.group.add(this.lightsGroup);

    // State
    this.timeOfDay = 12.0;       // 12:00 PM noon
    this.sunAltitude = 50.0;     // 50 degrees
    this.fogDensity = 0.0012;    // Gentle atmospheric haze that preserves bright sky
    this.showTrees = true;
    this.showPlot = false;

    // Lighting & Sky references
    this.skyMesh = null;
    this.sky = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.hemiLight = null;
    this.outdoorFog = null;

    // Saved state when switching between studio and outdoor
    this.savedStudioFog = null;
    this.savedStudioBg = null;

    // Culling list
    this.cullableObjects = [];
    this.frustum = new THREE.Frustum();
    this.projScreenMatrix = new THREE.Matrix4();
  }

  /**
   * Terrain height at coordinate (x, z).
   * Ensures the house plot is perfectly level (height = 0) and surrounding
   * ground is mostly plain and straight, with gentle distant rolling terrain.
   */
  getTerrainHeight(x, z) {
    const dist = Math.hypot(x, z);

    // Center plot: strictly flat at y = 0
    if (dist <= PLOT_CLEAR_RADIUS) {
      return 0.0;
    }

    // Near zone (10.5m - 35m): almost completely flat plain straight ground (< 0.12m grade)
    if (dist <= 35.0) {
      const t = (dist - PLOT_CLEAR_RADIUS) / (35.0 - PLOT_CLEAR_RADIUS);
      const gentle = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.12;
      return gentle * t;
    }

    // Mid to distant zone (35m - 300m): soft rolling landscape
    const tMid = Math.min((dist - 35.0) / 70.0, 1.0);
    const tFar = Math.max(0.0, Math.min((dist - 110.0) / 90.0, 1.0));

    const hNear = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 0.9 +
                  Math.cos(x * 0.02 + 1.2) * Math.sin(z * 0.02 + 0.8) * 1.2;

    // Distant ridges on horizon
    const hDistant = Math.sin(x * 0.009 + 0.5) * Math.cos(z * 0.009 - 0.3) * 10.0;

    return hNear * tMid + hDistant * tFar;
  }

  /**
   * Initialize all components of the outdoor environment.
   */
  init() {
    this._setupLighting();
    this._setupSky();
    this._setupTerrain();
    this._setupPlotGuide();
    this._setupVegetation();
  }

  // ─── Lighting Setup ────────────────────────────────────────────────────────
  _setupLighting() {
    // Hemispheric ambient light (soft blue sky / lush green earth)
    this.hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x14532d, 0.75);
    this.hemiLight.position.set(0, 120, 0);
    this.lightsGroup.add(this.hemiLight);

    // Sunlight (Directional with high-res soft shadow mapping)
    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.7);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 350;
    
    const d = 35;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0003;
    this.lightsGroup.add(this.sunLight);

    // Gentle ambient fill
    this.ambientLight = new THREE.AmbientLight(0x7dd3fc, 0.35);
    this.lightsGroup.add(this.ambientLight);
  }

  // ─── Sky Setup: Deep Dark Blue Gradient (Never Washes Out to White) ──────────
  _setupSky() {
    // Custom celestial sky dome with rich dark blue zenith gradient
    const skyGeo = new THREE.SphereGeometry(450, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor:     { value: new THREE.Color(0x082f64) }, // Deep dark blue at zenith
        midColor:     { value: new THREE.Color(0x1c6ecf) }, // Vibrant azure blue at 35°-50°
        bottomColor:  { value: new THREE.Color(0x8ec7f7) }, // Soft horizon sky blue
        sunColor:     { value: new THREE.Color(0xfff8e1) }, // Warm radiant sun highlight
        sunPosition:  { value: new THREE.Vector3(0, 150, 0) },
        sunIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform vec3 sunColor;
        uniform vec3 sunPosition;
        uniform float sunIntensity;
        varying vec3 vWorldPosition;

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float h = max(0.0, dir.y);

          // Rich two-stage gradient: pale horizon -> azure mid-sky -> deep dark blue overhead
          vec3 skyGrad;
          if (h < 0.22) {
            float t = pow(h / 0.22, 0.85);
            skyGrad = mix(bottomColor, midColor, t);
          } else {
            float t = pow((h - 0.22) / 0.78, 0.72);
            skyGrad = mix(midColor, topColor, t);
          }

          // Realistic sun disc & controlled warm halo (doesn't bleach the blue sky)
          vec3 sunDir = normalize(sunPosition);
          float cosTheta = dot(dir, sunDir);

          float sunDisc = smoothstep(0.9992, 0.9998, cosTheta) * 1.6;
          float sunCorona = pow(max(0.0, cosTheta), 32.0) * 0.45;
          float sunGlow = pow(max(0.0, cosTheta), 6.0) * 0.12;

          vec3 finalColor = skyGrad + (sunDisc + sunCorona + sunGlow) * sunColor * sunIntensity;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.sky = this.skyMesh; // Backward compatibility alias
    this.lightsGroup.add(this.skyMesh);

    this.outdoorFog = new THREE.FogExp2(0x8ec7f7, this.fogDensity);
    this._updateSunPosition();
  }

  _updateSunPosition() {
    if (!this.skyMesh || !this.sunLight) return;

    const h = this.timeOfDay;
    const azimuth = ((h - 6) / 12) * Math.PI;
    const altRad = (this.sunAltitude * Math.PI) / 180;

    const sunPos = new THREE.Vector3();
    sunPos.setFromSphericalCoords(250, Math.PI / 2 - Math.sin(azimuth) * altRad, azimuth);

    const uniforms = this.skyMesh.material.uniforms;
    uniforms['sunPosition'].value.copy(sunPos);
    this.sunLight.position.copy(sunPos);

    const sunH = sunPos.y;
    if (sunH < 0) {
      // Night / Twilight
      this.sunLight.intensity = 0.05;
      this.ambientLight.intensity = 0.12;
      this.hemiLight.intensity = 0.18;
      
      uniforms['topColor'].value.setHex(0x020614);
      uniforms['midColor'].value.setHex(0x071126);
      uniforms['bottomColor'].value.setHex(0x0d1a33);
      uniforms['sunColor'].value.setHex(0x7dd3fc);
      uniforms['sunIntensity'].value = 0.25;

      if (this.outdoorFog) this.outdoorFog.color.setHex(0x0a1424);
    } else {
      // Daytime lighting
      const factor = Math.min(sunH / 80, 1.0);
      this.sunLight.intensity = 1.3 + factor * 0.5;
      this.ambientLight.intensity = 0.28 + factor * 0.12;
      this.hemiLight.intensity = 0.65 + factor * 0.2;

      if (h < 7.5 || h > 17.5) {
        // Golden hour sunrise/sunset (rich amber, orange, violet)
        this.sunLight.color.setHex(0xfb923c);
        uniforms['topColor'].value.setHex(0x161c4f);
        uniforms['midColor'].value.setHex(0x7c2d12);
        uniforms['bottomColor'].value.setHex(0xf97316);
        uniforms['sunColor'].value.setHex(0xff7828);
        uniforms['sunIntensity'].value = 1.2;

        if (this.outdoorFog) this.outdoorFog.color.setHex(0xfde68a);
      } else {
        // Deep blue dark blue daylight sky gradient (NO WASHED-OUT WHITE!)
        this.sunLight.color.setHex(0xfff7ed);
        
        // Deep dark sapphire blue overhead at noon
        uniforms['topColor'].value.setHex(0x082f64);
        uniforms['midColor'].value.setHex(0x1c6ecf);
        uniforms['bottomColor'].value.setHex(0x8ec7f7);
        uniforms['sunColor'].value.setHex(0xfff8e1);
        uniforms['sunIntensity'].value = 1.0;

        if (this.outdoorFog) this.outdoorFog.color.setHex(0x8ec7f7);
      }
    }
  }

  // ─── Terrain Setup ─────────────────────────────────────────────────────────
  _setupTerrain() {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    // Apply procedural height map to vertices
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.getTerrainHeight(x, z));
    }
    geo.computeVertexNormals();

    // Textures with procedural fallbacks
    const texLoader = new THREE.TextureLoader();
    const loadTexSafe = (url, fallbackColor) => {
      const tex = texLoader.load(
        url,
        undefined,
        undefined,
        () => {
          const c = document.createElement('canvas');
          c.width = c.height = 4;
          const ctx = c.getContext('2d');
          ctx.fillStyle = fallbackColor;
          ctx.fillRect(0, 0, 4, 4);
          tex.image = c;
          tex.needsUpdate = true;
        }
      );
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    const grassTex = loadTexSafe('./environment/grass.avif', '#4ade80');
    const mudTex   = loadTexSafe('./environment/mud.webp', '#78350f');

    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.05,
      map: grassTex,
    });

    // Custom shader hook for blended mud plot & driveway
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
        vec2 gUV = vWorldPos.xz * 0.22;
        vec2 mUV = vWorldPos.xz * 0.15;
        vec4 grassC = texture2D(map, gUV);
        vec4 mudC   = texture2D(uMudMap, mUV);

        float dPlot  = length(vWorldPos.xz);
        float dDrive = abs(vWorldPos.x);

        // Neat garden paving / driveway leading outward (~2.5m wide)
        float drvMask = smoothstep(1.8, 0.6, dDrive)
                      * smoothstep(-2.0, 3.0, vWorldPos.z)
                      * smoothstep(32.0, 8.0, vWorldPos.z);

        // Soft transition from plot edge to grass
        float plotMask = smoothstep(${PLOT_CLEAR_RADIUS.toFixed(1)}, ${(PLOT_CLEAR_RADIUS * 0.65).toFixed(1)}, dPlot);
        float mudBlend = clamp(plotMask * 0.65 + drvMask * 0.85, 0.0, 1.0);

        diffuseColor = mix(grassC, mudC, mudBlend);
        `
      );
    };

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.terrainGroup.add(this.terrainMesh);
  }

  // ─── Plot Guide Setup ──────────────────────────────────────────────────────
  _setupPlotGuide() {
    this.plotGuideGroup.visible = this.showPlot;

    // 16m × 14m property boundary wireframe (proportional to house)
    const boxGeo = new THREE.BoxGeometry(16, 2.5, 14);
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    const wireMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.6,
      gapSize: 0.3,
      transparent: true,
      opacity: 0.75,
    });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    wire.computeLineDistances();
    wire.position.set(0, 1.25, 0);
    this.plotGuideGroup.add(wire);

    // Corner survey stakes
    const stakeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    const stakeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
    const capGeo = new THREE.SphereGeometry(0.09, 10, 10);
    const capMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    [[-8, -7], [8, -7], [-8, 7], [8, 7]].forEach(([cx, cz]) => {
      const stake = new THREE.Mesh(stakeGeo, stakeMat);
      stake.position.set(cx, 0.4, cz);
      stake.castShadow = true;
      this.plotGuideGroup.add(stake);

      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(cx, 0.85, cz);
      this.plotGuideGroup.add(cap);
    });
  }

  // ─── Trees & Vegetation Setup ──────────────────────────────────────────────
  _setupVegetation() {
    const gltfLoader = new GLTFLoader();

    gltfLoader.load(
      './environment/low_poly_forest_tree_pack.glb',
      (gltf) => {
        const treePrefabs = [];
        const rockPrefabs = [];

        gltf.scene.traverse((child) => {
          if (!child.isMesh) return;
          const name = child.name.toLowerCase();
          const prefab = this._preparePrefab(child);
          if (name.includes('rock')) {
            rockPrefabs.push(prefab);
          } else if (name.includes('tree') || name.includes('trunk') || name.includes('atlas') || name.includes('pine')) {
            treePrefabs.push(prefab);
          }
        });

        if (treePrefabs.length > 0) {
          // Shrunk vegetation scale so the house looks large and trees look realistically proportioned
          this._scatterPrefabs(treePrefabs, 65, TREE_MIN_RADIUS, 160, 0.28, 0.52);
          if (rockPrefabs.length > 0) {
            this._scatterPrefabs(rockPrefabs, 28, TREE_MIN_RADIUS - 1.5, 140, 0.10, 0.26);
          }
        } else {
          this._populateProceduralTrees();
        }
      },
      undefined,
      () => {
        // Fallback to procedural low-poly trees
        this._populateProceduralTrees();
      }
    );
  }

  _preparePrefab(mesh) {
    const clone = mesh.clone();
    clone.geometry = mesh.geometry.clone();
    clone.geometry.computeBoundingBox();

    const box = clone.geometry.boundingBox;
    const sY = box.max.y - box.min.y;
    const sZ = box.max.z - box.min.z;
    if (sZ > sY * 1.2) {
      clone.geometry.rotateX(-Math.PI / 2);
    }

    clone.geometry.computeBoundingBox();
    const minY = clone.geometry.boundingBox.min.y;
    clone.geometry.translate(0, -minY, 0);

    if (clone.material) {
      clone.material = clone.material.clone();
      clone.material.roughness = 0.55;
      clone.material.metalness = 0.05;
    }
    return clone;
  }

  _scatterPrefabs(prefabs, count, minDist, maxDist, minScale, maxScale) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist + Math.random() * (maxDist - minDist);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Keep driveway open towards positive Z
      if (z > -5 && z < 35 && Math.abs(x) < 4.5) continue;

      const pf = prefabs[Math.floor(Math.random() * prefabs.length)];
      const obj = pf.clone();
      const s = minScale + Math.random() * (maxScale - minScale);
      obj.scale.set(s, s, s);

      const groundY = this.getTerrainHeight(x, z);
      obj.position.set(x, groundY, z);
      obj.rotation.y = Math.random() * Math.PI * 2;

      obj.castShadow = true;
      obj.receiveShadow = true;

      this.vegetationGroup.add(obj);
      this.cullableObjects.push(obj);
    }
  }

  _populateProceduralTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.85 });
    const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

    // Clean low-poly evergreen tree naturally proportioned to house wall height (1.35)
    const trunkGeo = new THREE.CylinderGeometry(0.06, 0.11, 1.1, 7);
    trunkGeo.translate(0, 0.55, 0);

    const foliageGeo1 = new THREE.ConeGeometry(0.68, 1.3, 7);
    foliageGeo1.translate(0, 1.35, 0);
    const foliageGeo2 = new THREE.ConeGeometry(0.48, 1.0, 7);
    foliageGeo2.translate(0, 1.95, 0);

    for (let i = 0; i < 55; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = TREE_MIN_RADIUS + Math.random() * (150 - TREE_MIN_RADIUS);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      if (z > -5 && z < 35 && Math.abs(x) < 4.5) continue;

      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.castShadow = true;
      tree.add(trunk);

      const fMat = i % 2 === 0 ? foliageMat1 : foliageMat2;
      const f1 = new THREE.Mesh(foliageGeo1, fMat);
      f1.castShadow = true;
      tree.add(f1);

      const f2 = new THREE.Mesh(foliageGeo2, fMat);
      f2.castShadow = true;
      tree.add(f2);

      const s = 0.65 + Math.random() * 0.45;
      tree.scale.set(s, s, s);

      const gY = this.getTerrainHeight(x, z);
      tree.position.set(x, gY, z);
      tree.rotation.y = Math.random() * Math.PI * 2;

      this.vegetationGroup.add(tree);
      this.cullableObjects.push(tree);
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  enable() {
    this.enabled = true;
    this.group.visible = true;

    // Switch scene fog & background to realistic sky/atmosphere
    this.savedStudioFog = this.scene.fog;
    this.savedStudioBg = this.scene.background;

    this.scene.fog = this.outdoorFog;
    this.scene.background = null;

    this._updateSunPosition();
  }

  disable() {
    this.enabled = false;
    this.group.visible = false;

    // Restore studio settings
    if (this.savedStudioFog !== undefined) {
      this.scene.fog = this.savedStudioFog;
    }
    if (this.savedStudioBg !== undefined) {
      this.scene.background = this.savedStudioBg;
    }
  }

  /**
   * Position and scale the house model naturally inside the plot clearing.
   * The house is placed at (0, 0, 0) resting on the flat terrain surface.
   */
  placeHouse(planGroup, radius) {
    if (!planGroup) return;
    planGroup.position.set(0, 0.001, 0); // slight offset to prevent Z-fighting with terrain
    planGroup.scale.set(1, 1, 1);
  }

  /**
   * Reset house positioning when environment is turned off or plan is cleared.
   */
  resetHouse(planGroup) {
    if (!planGroup) return;
    planGroup.position.set(0, 0, 0);
    planGroup.scale.set(1, 1, 1);
  }

  setTimeOfDay(hours) {
    this.timeOfDay = THREE.MathUtils.clamp(hours, 0, 24);
    this._updateSunPosition();
  }

  setSunAltitude(degrees) {
    this.sunAltitude = THREE.MathUtils.clamp(degrees, 5, 85);
    this._updateSunPosition();
  }

  setFogDensity(density) {
    this.fogDensity = density;
    if (this.outdoorFog) {
      this.outdoorFog.density = density;
    }
    if (this.enabled) {
      this.scene.fog = density > 0.0001 ? this.outdoorFog : null;
    }
  }

  setVegetationVisible(visible) {
    this.showTrees = visible;
    this.vegetationGroup.visible = visible;
  }

  setPlotGuideVisible(visible) {
    this.showPlot = visible;
    this.plotGuideGroup.visible = visible;
  }

  /**
   * Camera position presets for viewing the house in the outdoor landscape.
   * Scaled close to the house so it appears large, clear, and prominent.
   */
  getCameraPreset(name) {
    switch (name) {
      case 'overview':
        return { pos: [13, 7.5, 15], target: [0, 0.75, 0] };
      case 'front':
        return { pos: [0, 1.6, 9.5], target: [0, 0.85, 0] };
      case 'side':
        return { pos: [10.5, 1.6, 0], target: [0, 0.85, 0] };
      case 'top':
        return { pos: [0, 19, 0.05], target: [0, 0, 0] };
      default:
        return { pos: [13, 7.5, 15], target: [0, 0.75, 0] };
    }
  }

  /**
   * Frame update called in the main render loop.
   */
  update(delta) {
    if (!this.enabled) return;

    // Frustum culling on scattered trees/vegetation for peak performance
    if (this.showTrees && this.cullableObjects.length > 0 && this.camera) {
      this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

      for (let i = 0; i < this.cullableObjects.length; i++) {
        const obj = this.cullableObjects[i];
        obj.visible = this.frustum.containsPoint(obj.position);
      }
    }
  }
}
