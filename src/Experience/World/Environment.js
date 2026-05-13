import * as THREE from "three/webgpu";
import { texture, oneMinus } from "three/tsl";
import { Experience } from "../Experience";
import { hatchUniforms } from "../Materials/HatchedMaterial";

export class Environment {
  constructor() {
    this.experience = Experience.getInstance();

    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshStandardNodeMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    this.experience.scene.add(plane);

    this.init();
  }

  init() {
    this.gui = this.experience.gui.addFolder("Environment");

    this.setupScene();
    this.setupDirectionalLight();
    this.setupProjectorLight();
    // this.setupGobos();
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

  setupProjectorLight() {
    const goboTex = this.experience.resources.items.goboTexture;
    goboTex.minFilter = THREE.LinearFilter;
    goboTex.magFilter = THREE.LinearFilter;
    goboTex.generateMipmaps = false;
    goboTex.colorSpace = THREE.NoColorSpace;

    this.projectorLight = new THREE.SpotLight("#ffffff", 50);
    this.projectorLight.map = goboTex;
    this.projectorLight.position.set(60, 75, 50);
    this.projectorLight.angle = Math.PI / 8;
    this.projectorLight.penumbra = 0.1;
    this.projectorLight.decay = 0;
    this.projectorLight.distance = 0;
    this.projectorLight.castShadow = true;
    this.projectorLight.shadow.mapSize.width = 1024;
    this.projectorLight.shadow.mapSize.height = 1024;
    this.projectorLight.shadow.camera.near = 0.1;
    this.projectorLight.shadow.camera.far = 200;
    this.projectorLight.shadow.focus = 1;
    this.experience.scene.add(this.projectorLight);

    this.projectorLight.target.position.set(8, 10, -23);
    this.experience.scene.add(this.projectorLight.target);

    this.projectorLightHelper = new THREE.SpotLightHelper(this.projectorLight);
    this.projectorLightHelper.visible = true;
    this.experience.scene.add(this.projectorLightHelper);

    this.projectorShadowHelper = new THREE.CameraHelper(
      this.projectorLight.shadow.camera,
    );
    this.projectorShadowHelper.visible = true;
    this.experience.scene.add(this.projectorShadowHelper);

    const folder = this.gui.addFolder("Projector Light");

    const onMove = () => {
      this.projectorLightHelper.update();
      this.projectorShadowHelper.update();
    };

    folder
      .addColor({ color: "#ffffff" }, "color")
      .name("Color")
      .onChange((val) => this.projectorLight.color.set(val));
    folder.add(this.projectorLight, "intensity", 0, 500, 1).name("Intensity");
    folder
      .add(this.projectorLight, "angle", 0, Math.PI / 3, 0.01)
      .name("Angle");
    folder.add(this.projectorLight, "penumbra", 0, 1, 0.01).name("Penumbra");
    folder.add(this.projectorLight, "decay", 0, 4, 0.01).name("Decay");
    folder.add(this.projectorLight, "distance", 0, 500, 1).name("Distance");
    folder
      .add(this.projectorLight.shadow, "focus", 0, 1, 0.01)
      .name("Shadow Focus");
    folder.add(this.projectorLight, "visible").name("Visible");

    const pos = folder.addFolder("Position");
    pos
      .add(this.projectorLight.position, "x", -100, 100, 0.1)
      .name("X")
      .onChange(onMove);
    pos
      .add(this.projectorLight.position, "y", -100, 100, 0.1)
      .name("Y")
      .onChange(onMove);
    pos
      .add(this.projectorLight.position, "z", -100, 100, 0.1)
      .name("Z")
      .onChange(onMove);

    const tgt = folder.addFolder("Target");
    tgt
      .add(this.projectorLight.target.position, "x", -50, 50, 0.1)
      .name("X")
      .onChange(onMove);
    tgt
      .add(this.projectorLight.target.position, "y", -50, 50, 0.1)
      .name("Y")
      .onChange(onMove);
    tgt
      .add(this.projectorLight.target.position, "z", -50, 50, 0.1)
      .name("Z")
      .onChange(onMove);

    folder
      .add(this.projectorLightHelper, "visible")
      .name("Show Helper")
      .setValue(true);
    folder
      .add(this.projectorShadowHelper, "visible")
      .name("Show Shadow Frustum")
      .setValue(true);
  }

  setupGobos() {
    const gltf = this.experience.resources.items.gobos;

    this.experience.scene.add(gltf.scene);
  }

  resize() {}

  update() {}
}
