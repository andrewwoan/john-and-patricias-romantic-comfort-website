import * as THREE from "three/webgpu";
import { Experience } from "./Experience";

import gsap from "gsap";
import { element } from "three/tsl";

export class Raycaster {
  constructor() {
    this.experience = Experience.getInstance();
    this.instance = new THREE.Vector2(0, 0);
    this.mouse = this.experience.mouse;
    this.camera = this.experience.camera.instance;
    this.canvas = this.experience.canvasElement;

    this.raycaster = new THREE.Raycaster();
    this.hoveredObject = null;

    this.intersectObjects = [];
    this.meshes = [];

    this.isModalOpen = false;

    this.init();
  }

  populateIntersectObjects(objects) {
    objects.forEach((object) => {
      const newObject = {
        ...object,
        originalScale: object.mesh.scale.clone(),
        isScaled: false,
        element: object.elementId
          ? document.getElementById(object.elementId)
          : null,
      };
      this.intersectObjects.push(newObject);

      if (newObject.element) this.initModalCloseButton(newObject);
    });

    this.meshes = this.intersectObjects.map((object) => object.mesh);
  }

  initModalCloseButton(object) {
    const closeButton = object.element.querySelector(".modal__close-button");

    if (!closeButton) return;

    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      gsap.to(object.element, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          object.element.classList.remove("modal-open");
          this.isModalOpen = false;
        },
      });
    });
  }

  init() {
    const handleClickandTouch = () => {
      if (this.isModalOpen) return;

      const intersects = this.raycaster.intersectObjects(this.meshes);
      if (!intersects.length) return;

      const intersectedObject = intersects[0].object;
      const parentObject = this.getParentObject(intersectedObject);

      if (!parentObject) return;

      switch (parentObject.type) {
        case "url":
          window.open(parentObject.url, "_blank", "noopener, noreferrer");
          break;
        case "scale":
          break;
        case "modal":
          gsap.to(parentObject.element, {
            opacity: 1,
            onStart: () => {
              this.isModalOpen = true;
              parentObject.element.classList.add("modal-open");
            },
          });
          break;
      }
    };
    this.canvas.addEventListener("click", handleClickandTouch);
    this.canvas.addEventListener("touchend", handleClickandTouch);
  }

  resize() {}

  getParentObject(intersectedObject) {
    let object = intersectedObject;
    while (object) {
      const parent = this.intersectObjects.find(
        (index) => index.mesh === object,
      );
      if (parent) return parent;
      object = object.parent;
    }
  }

  update() {
    if (this.isModalOpen) {
      if (this.hoveredObject) {
        document.body.style.cursor = "default";
        gsap.to(this.hoveredObject.mesh.scale, {
          x: this.hoveredObject.originalScale.x,
          y: this.hoveredObject.originalScale.y,
          z: this.hoveredObject.originalScale.z,
          duration: 0.4,
        });
        this.hoveredObject = null;
      }
      return;
    }

    this.raycaster.setFromCamera(this.mouse.instance, this.camera);
    const intersects = this.raycaster.intersectObjects(this.meshes);

    if (intersects.length) {
      const intersectedObject = intersects[0].object;
      const parentObject = this.getParentObject(intersectedObject);

      if (parentObject && parentObject !== this.hoveredObject) {
        document.body.style.cursor = "pointer";
        this.hoveredObject = parentObject;
        console.log(parentObject);
        gsap.to(parentObject.mesh.scale, {
          x: parentObject.originalScale.x * 1.2,
          y: parentObject.originalScale.y * 1.2,
          z: parentObject.originalScale.z * 1.2,
          duration: 0.4,
        });
      }
    } else {
      if (this.hoveredObject) {
        document.body.style.cursor = "default";
        gsap.to(this.hoveredObject.mesh.scale, {
          x: this.hoveredObject.originalScale.x,
          y: this.hoveredObject.originalScale.y,
          z: this.hoveredObject.originalScale.z,
          duration: 0.4,
        });
        this.hoveredObject = null;
      }
    }
  }
}
