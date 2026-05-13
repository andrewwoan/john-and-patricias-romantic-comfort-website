import * as THREE from "three/webgpu";
import { Experience } from "../Experience";
import { Character } from "./Character";
import { Environment } from "./Environment";
import { Background } from "./Background";

export class World {
  constructor() {
    this.experience = Experience.getInstance();

    this.experience.resources.on("ready", () => {
      // this.character = new Character();
      this.background = new Background();
      // this.waterPlane = new WaterPlane();
      this.environment = new Environment();
      // this.experience.outline.apply(this.experience.scene);
    });

    this.init();
  }

  init() {}

  resize() {}

  update() {
    this.test?.update();
    this.newTest?.update();
    this.rain?.update();
  }
}
