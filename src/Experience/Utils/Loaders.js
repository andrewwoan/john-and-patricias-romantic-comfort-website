import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import * as THREE from "three/webgpu";

export class Loaders {
  constructor() {
    this.init();
  }

  init() {
    this.loaders = {};
    this.loaders.gltfLoader = new GLTFLoader();
    this.loaders.dracoLoader = new DRACOLoader();
    this.loaders.dracoLoader.setDecoderPath("/draco/");
    this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader);
    this.loaders.imageBitmapLoader = new THREE.ImageBitmapLoader();
    this.loaders.imageBitmapLoader.setOptions({ imageOrientation: "flipY" });
    this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader();
    this.loaders.textureLoader = new THREE.TextureLoader();
  }
}
