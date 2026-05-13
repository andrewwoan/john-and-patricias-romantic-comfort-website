import * as THREE from "three/webgpu";
import {
  pass,
  screenUV,
  float,
  uniform,
  length,
  smoothstep,
} from "three/tsl";
import { Experience } from "./Experience";

export class Renderer {
  constructor() {
    this.experience = Experience.getInstance();
  }

  async init() {
    this.renderer = new THREE.WebGPURenderer({
      canvas: this.experience.canvasElement,
      antialias: true,
    });

    await this.renderer.init();
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.setSize(
      this.experience.sizes.width,
      this.experience.sizes.height,
    );
    this.renderer.setPixelRatio(this.experience.sizes.pixelratio);

    this.experience.scene.background = null;

    // Contrast uniform
    this.uContrast = uniform(1.2);

    // Vignette uniforms
    this.uVignetteAmount = uniform(1.0);
    this.uVignetteStrength = uniform(0.5);
    this.uVignetteRadius = uniform(0.8);
    this.uVignetteSoftness = uniform(0.33);

    const scenePass = pass(
      this.experience.scene,
      this.experience.camera.instance,
    );

    const sceneColor = scenePass.getTextureNode();

    const contrasted = sceneColor.rgb.sub(0.5).mul(this.uContrast).add(0.5);

    const dist = length(screenUV.sub(0.5));
    const inner = this.uVignetteRadius.sub(this.uVignetteSoftness);
    const outer = this.uVignetteRadius;
    const falloff = smoothstep(inner, outer, dist).mul(this.uVignetteStrength);
    const vignette = float(1)
      .sub(falloff.mul(this.uVignetteAmount))
      .clamp(0, 1);
    const finalColor = contrasted.mul(vignette);

    this.postProcessing = new THREE.RenderPipeline(this.renderer);
    this.postProcessing.outputNode = finalColor;

    this.setupGUI();
  }

  setupGUI() {
    const postFolder = this.experience.gui.addFolder("Post");

    const postParams = {
      contrast: 1.2,
    };

    postFolder.add(postParams, "contrast", 0, 3, 0.01).onChange((v) => {
      this.uContrast.value = v;
    });

    const vignetteFolder = this.experience.gui.addFolder("Vignette");

    const vignetteParams = {
      enabled: true,
      strength: 0.5,
      radius: 0.8,
      softness: 0.33,
    };

    vignetteFolder.add(vignetteParams, "enabled").onChange((v) => {
      this.uVignetteAmount.value = v ? 1.0 : 0.0;
    });

    vignetteFolder.add(vignetteParams, "strength", 0, 2, 0.01).onChange((v) => {
      this.uVignetteStrength.value = v;
    });

    vignetteFolder.add(vignetteParams, "radius", 0, 1, 0.01).onChange((v) => {
      this.uVignetteRadius.value = v;
    });

    vignetteFolder.add(vignetteParams, "softness", 0, 1, 0.01).onChange((v) => {
      this.uVignetteSoftness.value = v;
    });
  }

  resize() {
    this.renderer.setSize(
      this.experience.sizes.width,
      this.experience.sizes.height,
    );
    this.renderer.setPixelRatio(this.experience.sizes.pixelratio);
  }

  update() {
    this.postProcessing.render();
  }
}
