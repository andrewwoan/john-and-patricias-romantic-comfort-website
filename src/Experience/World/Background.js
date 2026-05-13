import * as THREE from "three/webgpu";
import { Experience } from "../Experience";

export class Background {
  constructor() {
    this.experience = Experience.getInstance();
    this.model = this.experience.resources.items.loveYou.scene;
    this.init();
  }

  init() {
    this.model.traverse((obj) => {
      if (!obj.isMesh) return;

      // GLTFLoader creates MeshStandardMaterial (WebGL), which the WebGPU
      // compatibility shim doesn't reliably wire up for shadow receiving.
      // Convert to MeshStandardNodeMaterial so shadows work properly.
      // .copy() can't be used here — NodeMaterial doesn't inherit from
      // MeshStandardMaterial so standard PBR properties (map, roughness, etc.)
      // must be transferred manually.
      if (!obj.material.isNodeMaterial) {
        const old = obj.material;
        const mat = new THREE.MeshStandardNodeMaterial();
        mat.map = old.map;
        mat.color.copy(old.color);
        old.dispose();
        obj.material = mat;
      }

      obj.receiveShadow = true;
      obj.castShadow = false;
    });

    this.experience.scene.add(this.model);
  }

  resize() {}
  update() {}
  destroy() {}
}
