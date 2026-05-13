import * as THREE from "three/webgpu";
import { Experience } from "../Experience";
import { createHatchedMaterial } from "../Materials/HatchedMaterial";
import { color as tslColor } from "three/tsl";

export class NewTest {
  constructor() {
    this.experience = Experience.getInstance();
    this.test = this.experience.resources.items.test.scene;
    this.init();
  }

  init() {
    this.applyHatching(this.test);
    this.experience.scene.add(this.test);
  }

  applyHatching(root) {
    root.traverse((obj) => {
      if (!obj.isMesh) return;

      const original = obj.material;

      if (original.name && original.name.includes("Glass")) {
        // original.depthWrite = false;

        obj.castShadow = true;
        obj.receiveShadow = true;
        console.log("Glass material:", {
          transparent: original.transparent,
          opacity: original.opacity,
          alphaMap: !!original.alphaMap,
        });
        return;
      }

      obj.material = createHatchedMaterial({
        color: original.color ? original.color.clone() : 0xffffff,
        map: original.map ?? null,
      });

      obj.castShadow = true;
      obj.receiveShadow = true;
    });
  }

  resize() {}
  update() {}
  destroy() {}
}
