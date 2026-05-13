import * as THREE from "three/webgpu";
import { Experience } from "./Experience";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import normalizeWheel from "normalize-wheel";

export class Controls {
  constructor() {
    this.experience = Experience.getInstance();
    this.canvas = this.experience.canvasElement;
    this.camera = this.experience.camera.instance;
    this.cameraRig = this.experience.camera.cameraRig;
    this.mouse = this.experience.mouse.instance;

    this.targetPosition = this.cameraRig.position.clone();
    this.speed = 0.01;
    this.lerpFactor = 0.05;
    this.initialTouchX = null;
    this.touchMultipler = 2;
    this.mouseOffsetStrength = 0.5;
    this.targetOffset = new THREE.Vector3();
    this.targetRotation = new THREE.Euler(0, 0, 0);

    this.bounds = { max: 12.268600582852038, min: -17.731339744466 };
    this.range = this.bounds.max - this.bounds.min;
    this.progress = (this.cameraRig.position.z - this.bounds.min) / this.range;

    this.init();
  }

  init() {
    this.canvas.addEventListener("wheel", (e) => {
      if (this.experience.raycaster.isModalOpen) return;

      const normalizedWheel = normalizeWheel(e);
      this.targetPosition.z -= normalizedWheel.pixelY * this.speed;
      this.targetPosition.z = THREE.MathUtils.clamp(
        this.targetPosition.z,
        this.bounds.min,
        this.bounds.max,
      );
    });

    this.canvas.addEventListener("touchstart", (e) => {
      if (this.experience.raycaster.isModalOpen) return;

      this.initialTouchX = e.touches[0].clientX;
    });

    this.canvas.addEventListener("touchmove", (e) => {
      if (this.experience.raycaster.isModalOpen) return;

      if (this.initialTouchX === null) return;
      const deltaX = this.initialTouchX - e.touches[0].clientX;
      this.targetPosition.z -= deltaX * this.speed * this.touchMultipler;
      this.targetPosition.z = THREE.MathUtils.clamp(
        this.targetPosition.z,
        this.bounds.min,
        this.bounds.max,
      );
      this.initialTouchX = e.touches[0].clientX;
    });
  }

  resize() {}

  update() {
    this.progress = (this.cameraRig.position.z - this.bounds.min) / this.range;
    this.cameraRig.position.lerp(this.targetPosition, this.lerpFactor);

    if (this.experience.device.isMobileDevice) {
      return;
    }

    this.targetOffset.set(
      this.mouse.x * this.mouseOffsetStrength,
      this.mouse.y * this.mouseOffsetStrength,
      0,
    );

    this.camera.rotation.x = THREE.MathUtils.lerp(
      this.camera.rotation.x,
      this.mouse.y * this.mouseOffsetStrength * 0.1,
      0.1,
    );
    this.camera.rotation.y = THREE.MathUtils.lerp(
      this.camera.rotation.y,
      -this.mouse.x * this.mouseOffsetStrength * 0.1,
      0.1,
    );

    this.camera.position.lerp(this.targetOffset, 0.15);
  }
}
