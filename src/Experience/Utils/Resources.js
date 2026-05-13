import * as THREE from "three/webgpu";

import { EventEmitter } from "events";
import { Loaders } from "./Loaders";
import assets from "./assets";

export class Resources extends EventEmitter {
  constructor() {
    super();

    this.loaders = new Loaders().loaders;
    this.assets = assets;

    this.items = {};
    this.queue = this.assets.length;
    this.loaded = 0;

    this.startLoading();
  }

  startLoading() {
    for (const asset of this.assets) {
      if (asset.type === "glbModel") {
        this.loaders.gltfLoader.load(asset.path, (file) => {
          this.singleAssetLoaded(asset.name, file);
        });
      } else if (asset.type === "skybox") {
        this.loaders.cubeTextureLoader.load(asset.path, (file) => {
          this.singleAssetLoaded(asset.name, file);
        });
      }
    }
  }

  singleAssetLoaded(asset, file) {
    this.items[asset] = file;
    this.loaded++;
    this.emit("progress", this.loaded / this.queue);

    if (this.loaded === this.queue) {
      this.emit("ready");
    }
  }
}
