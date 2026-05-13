import * as THREE from "three/webgpu";
import { Experience } from "../Experience";
import { createHatchedMaterial } from "../Materials/HatchedMaterial";
// Mirrors the "Test" geometry node group:
//   Cube(1×1×0.4) + Cylinder(r=0.4, h=0.4) on top → instanced on N points
//   where each point's X position == its index (Blender ID node → CombineXYZ.X → Points.Position)
export class GeoTest {
  constructor(count = 8) {
    this.experience = Experience.getInstance();
    this.count = count;
    this.init();
  }

  init() {
    const material = createHatchedMaterial({ color: 0xffffff });

    // Cube: 1×0.4×1 (Three.js Y-up) — Blender Size [1,1,0.4]
    const cubeGeo = new THREE.BoxGeometry(1, 0.4, 1);
    this.cubeMesh = new THREE.InstancedMesh(cubeGeo, material, this.count);
    this.cubeMesh.castShadow = true;
    this.cubeMesh.receiveShadow = true;

    // Cylinder: r=0.4, h=0.4, 32 verts — centered at Y=0.4 so bottom sits at Y=0.2 (top of cube)
    const cylGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 32);
    this.cylMesh = new THREE.InstancedMesh(cylGeo, material, this.count);
    this.cylMesh.castShadow = true;
    this.cylMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.count; i++) {
      // ID node → CombineXYZ → Points.Position: each point at [index, 0, 0]
      dummy.position.set(i, 0, 0);
      dummy.updateMatrix();
      this.cubeMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(i, 0.4, 0);
      dummy.updateMatrix();
      this.cylMesh.setMatrixAt(i, dummy.matrix);
    }
    this.cubeMesh.instanceMatrix.needsUpdate = true;
    this.cylMesh.instanceMatrix.needsUpdate = true;

    this.group = new THREE.Group();
    this.group.add(this.cubeMesh, this.cylMesh);
    this.experience.scene.add(this.group);
  }

  resize() {}
  update() {}

  destroy() {
    this.cubeMesh.geometry.dispose();
    this.cylMesh.geometry.dispose();
    this.cubeMesh.material.dispose();
    this.experience.scene.remove(this.group);
  }
}
