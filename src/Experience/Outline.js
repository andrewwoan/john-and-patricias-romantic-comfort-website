// Outline.js
import * as THREE from "three/webgpu";
import {
  positionLocal,
  normalLocal,
  time,
  hash,
  vec3,
  uniform,
  color,
  Fn,
} from "three/tsl";
import { Experience } from "./Experience";

export class Outline {
  constructor() {
    this.experience = Experience.getInstance();

    this.uThickness = uniform(0.002);
    this.uJitterAmount = uniform(0.008);
    this.uJitterSpeed = uniform(3.5);
    this.uColor = uniform(color(0x1a1410)); // dark brown ink, not pure black
    this.uThicknessVariation = uniform(0.4); // 0 = uniform, 1 = lots of variation

    this.outlineMeshes = [];

    this.setupMaterial();
    this.setupGUI();
  }

  setupMaterial() {
    const steppedTime = time.mul(this.uJitterSpeed).floor();

    // Per-vertex jitter (position wobble)
    const jitterSeed = positionLocal.add(steppedTime);
    const jitter = vec3(
      hash(jitterSeed),
      hash(jitterSeed.add(1.234)),
      hash(jitterSeed.add(5.678)),
    )
      .sub(0.5)
      .mul(this.uJitterAmount);

    // Thickness variation — each vertex gets a slightly different thickness
    // Also stepped in time so it "boils" along with the jitter
    const thicknessNoise = hash(positionLocal.add(steppedTime.mul(0.7)));
    const variedThickness = this.uThickness.mul(
      thicknessNoise
        .mul(this.uThicknessVariation)
        .add(this.uThicknessVariation.oneMinus()),
    );

    // Inflate along normal with varied thickness, then add jitter
    const inflated = positionLocal.add(normalLocal.mul(variedThickness));
    const finalPos = inflated.add(jitter);

    this.material = new THREE.MeshBasicNodeMaterial({
      side: THREE.BackSide,
    });
    this.material.positionNode = finalPos;
    this.material.colorNode = this.uColor;
  }

  apply(root) {
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.userData.isOutline) return;
      if (obj.userData.noOutline) return;

      // Clone geometry and smooth the normals for outline inflation
      const outlineGeometry = obj.geometry.clone();
      this.smoothNormals(outlineGeometry);

      const outlineMesh = new THREE.Mesh(outlineGeometry, this.material);
      outlineMesh.userData.isOutline = true;
      outlineMesh.castShadow = false;
      outlineMesh.receiveShadow = false;

      obj.add(outlineMesh);
      this.outlineMeshes.push(outlineMesh);
    });
  }

  // Merge vertices at same position and average their normals
  // This makes inverted hull work on hard-edged models
  smoothNormals(geometry) {
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;

    // Build a map from position -> list of normals at that position
    const posMap = new Map();
    const precision = 1000; // rounding for position matching

    for (let i = 0; i < position.count; i++) {
      const key = [
        Math.round(position.getX(i) * precision),
        Math.round(position.getY(i) * precision),
        Math.round(position.getZ(i) * precision),
      ].join(",");

      if (!posMap.has(key)) posMap.set(key, []);
      posMap.get(key).push(i);
    }

    // For each unique position, average the normals and write back
    const tempNormal = new THREE.Vector3();
    for (const indices of posMap.values()) {
      tempNormal.set(0, 0, 0);
      for (const i of indices) {
        tempNormal.x += normal.getX(i);
        tempNormal.y += normal.getY(i);
        tempNormal.z += normal.getZ(i);
      }
      tempNormal.normalize();
      for (const i of indices) {
        normal.setXYZ(i, tempNormal.x, tempNormal.y, tempNormal.z);
      }
    }

    normal.needsUpdate = true;
  }

  setupGUI() {
    const folder = this.experience.gui.addFolder("Outline");

    const params = {
      thickness: 0.02,
      jitterAmount: 0.008,
      jitterSpeed: 10,
      thicknessVariation: 0.4,
      color: "#1a1410",
    };

    folder.add(params, "thickness", 0, 0.1, 0.001).onChange((v) => {
      this.uThickness.value = v;
    });
    folder.add(params, "jitterAmount", 0, 0.05, 0.0005).onChange((v) => {
      this.uJitterAmount.value = v;
    });
    folder.add(params, "jitterSpeed", 1, 30, 1).onChange((v) => {
      this.uJitterSpeed.value = v;
    });
    folder.add(params, "thicknessVariation", 0, 1, 0.01).onChange((v) => {
      this.uThicknessVariation.value = v;
    });
    folder.addColor(params, "color").onChange((v) => {
      this.uColor.value.set(v);
    });
  }
}
