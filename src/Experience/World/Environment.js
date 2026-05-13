import * as THREE from "three/webgpu";
import { texture, oneMinus } from "three/tsl";
import { Experience } from "../Experience";
import { hatchUniforms } from "../Materials/HatchedMaterial";

export class Environment {
  constructor() {
    this.experience = Experience.getInstance();

    this.init();
  }

  init() {
    this.gui = this.experience.gui.addFolder("Environment");

    this.setupScene();
    this.setupDirectionalLight();
    this.setupGobos();
  }

  setupScene() {
    const defaultColor = "#ffffff";
    // this.experience.scene.background = new THREE.Color(defaultColor);
    this.experience.scene.background = this.experience.resources.items.skybox;
    this.experience.scene.backgroundIntensity = 0.45;
    this.gui
      .addColor({ color: defaultColor }, "color")
      .name("Background")
      .onChange((val) => {
        this.experience.scene.background.set(val);
        // Keep fog synced with background for seamless blending
        if (this._fogMatchesBackground && this.experience.scene.fog) {
          this.experience.scene.fog.color.set(val);
          this._fogColorCtrl?.setValue(val);
        }
      });
  }

  setupDirectionalLight() {
    this.directionalLight = new THREE.DirectionalLight("#ffffff", 2.56);
    this.directionalLight.position.set(60, 75, 50);
    this.directionalLight.target.position.set(8, 10, -23);
    this.experience.scene.add(this.directionalLight);
    this.experience.scene.add(this.directionalLight.target);

    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 200;
    this.directionalLight.shadow.camera.left = -80;
    this.directionalLight.shadow.camera.right = 80;
    this.directionalLight.shadow.camera.top = 80;
    this.directionalLight.shadow.camera.bottom = -80;
    this.directionalLight.shadow.normalBias = 0.01;

    this.directionalLightHelper = new THREE.DirectionalLightHelper(
      this.directionalLight,
      0.5,
    );
    this.experience.scene.add(this.directionalLightHelper);

    this.shadowCameraHelper = new THREE.CameraHelper(
      this.directionalLight.shadow.camera,
    );
    this.experience.scene.add(this.shadowCameraHelper);

    // Push the initial direction into the hatch uniform.
    this.syncHatchLightDir();

    const folder = this.gui.addFolder("Directional Light");
    folder
      .addColor({ color: "#ffffff" }, "color")
      .name("Color")
      .onChange((val) => this.directionalLight.color.set(val));
    folder
      .add(this.directionalLight, "intensity", 0, 5, 0.01)
      .name("Intensity");
    folder.add(this.directionalLight, "visible").name("Visible");

    const onMove = () => {
      this.directionalLightHelper.update();
      this.shadowCameraHelper.update();
      this.syncHatchLightDir();
    };

    const pos = folder.addFolder("Position");
    pos
      .add(this.directionalLight.position, "x", -20, 20, 0.1)
      .name("X")
      .onChange(onMove);
    pos
      .add(this.directionalLight.position, "y", -20, 20, 0.1)
      .name("Y")
      .onChange(onMove);
    pos
      .add(this.directionalLight.position, "z", -20, 20, 0.1)
      .name("Z")
      .onChange(onMove);

    const target = folder.addFolder("Target");
    target
      .add(this.directionalLight.target.position, "x", -10, 10, 0.1)
      .name("X")
      .onChange(onMove);
    target
      .add(this.directionalLight.target.position, "y", -10, 10, 0.1)
      .name("Y")
      .onChange(onMove);
    target
      .add(this.directionalLight.target.position, "z", -10, 10, 0.1)
      .name("Z")
      .onChange(onMove);

    folder.add(this.directionalLightHelper, "visible").name("Show Helper");
    folder.add(this.shadowCameraHelper, "visible").name("Show Shadow Frustum");
  }

  syncHatchLightDir() {
    const dir = new THREE.Vector3()
      .subVectors(
        this.directionalLight.position,
        this.directionalLight.target.position,
      )
      .normalize();
    hatchUniforms.lightDirectionWorld.value.copy(dir);
  }

  setupGobos() {
    const gltf = this.experience.resources.items.gobos;

    this.experience.scene.add(gltf.scene);
  }

  resize() {}

  update() {}
}
