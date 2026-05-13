import * as THREE from "three/webgpu";
import GUI from "lil-gui";
import { Time } from "./Utils/Time";
import { Sizes } from "./Utils/Sizes";
import { Camera } from "./Camera";
import { Renderer } from "./Renderer";
import { World } from "./World/World";
import { Resources } from "./Utils/Resources";
import { Controls } from "./Controls";
import { Mouse } from "./Mouse";
import { Raycaster } from "./Raycaster";
import { Device } from "./Utils/Device";
import { Preloader } from "./Preloader";
import { Outline } from "./Outline";

export class Experience {
  static getInstance() {
    return Experience.instance;
  }

  constructor() {
    if (Experience.instance) return Experience.instance;

    Experience.instance = this;

    this.init();
  }

  async init() {
    this.canvasElement = document.getElementById("experience-canvas");

    this.scene = new THREE.Scene();
    this.gui = new GUI({ title: "Controls" });
    this.time = new Time();
    this.device = new Device();
    this.sizes = new Sizes();
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.mouse = new Mouse();
    // this.controls = new Controls();
    this.raycaster = new Raycaster();
    await this.renderer.init();

    this.resources = new Resources();
    // this.preloader = new Preloader();
    this.outline = new Outline();

    this.world = new World();

    this.outline.apply(this.scene);

    this.time.on("update", () => {
      this.update();
    });
    this.sizes.on("resize", () => {
      this.resize();
    });
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.world.update();
    this.renderer.update();
    this.camera.update();
    this.raycaster.update();
    // this.controls.update();
  }
}
