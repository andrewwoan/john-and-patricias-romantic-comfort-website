import * as THREE from "three/webgpu";
import { Experience } from "./Experience";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export class Camera {
  constructor() {
    this.experience = Experience.getInstance();

    this.init();
    this.setOrbitControls();
  }

  init() {
    this.instance = new THREE.PerspectiveCamera(
      40,
      this.experience.sizes.aspect,
      0.1,
      1000,
    );
    // this.instance = new THREE.OrthographicCamera(
    //   (-this.experience.sizes.aspect * 5) / 2,
    //   (this.experience.sizes.aspect * 5) / 2,
    //   5 / 2,
    //   -5 / 2,
    //   -50,
    //   50,
    // );

    this.instance.position.set(0, 7.3276204297380789, 15.9035362538756501);

    this.experience.scene.add(this.instance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(
      this.instance,
      this.experience.canvasElement,
    );
    this.controls.enableDamping = true;

    this.controls.target.set(0, 7.30654614930856, -0.9060611041720253);
  }

  resize() {
    this.instance.aspect = this.experience.sizes.aspect;
    this.instance.updateProjectionMatrix();
  }

  update() {
    // console.log(this.instance.position);
    // console.log(this.controls.target);
    if (this.controls) {
      this.controls.update();
    }
  }
}
