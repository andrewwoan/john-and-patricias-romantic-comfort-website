import * as THREE from "three/webgpu";
import { uv, vec3, vec4, float, mix, uniform, vec2 } from "three/tsl";
import GUI from "lil-gui";
import { Experience } from "../Experience";
import { textureCoordinate } from "../Nodes/textureCoordinate";
import { mapping } from "../Nodes/mapping";
import { gradient } from "../Nodes/gradient";
import { voronoi } from "../Nodes/voronoi";
import { blendMode } from "../Nodes/blendMode";
import { mapRange } from "../Nodes/mapRange";

import gsap from "gsap";

export class Character {
  constructor() {
    this.experience = Experience.getInstance();
    this.character = this.experience.resources.items.character.scene;
    this.time = uniform(0);
    this.voronoiAnimOffset = {
      x: uniform(0),
      y: uniform(0),
    };

    this.pondBounds = {
      min: uniform(vec3(0, 0, 0)),
      max: uniform(vec3(1, 1, 1)),
    };

    this.gradientSettings = {
      coordType: "uv",
      type: "linear",
      colorA: "#59ccf3",
      colorB: "#75e0f5",
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
    };

    this.voronoiSettings = {
      coordType: "generated",
      subdivision: 5,
      seed: 0,
      output: "pointDistance",
      colorA: "#23d7fb",
      colorB: "#ffffff",
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      animSpeedX: 0.3,
      animSpeedY: 0.1,
    };

    this.blendSettings = {
      mode: "mix",
      factor: 0.5,
    };

    this.init();
  }

  init() {
    this.experience.scene.add(this.character);
    this.assignMaterials();
    this.setupDebug();
  }

  assignMaterials() {
    this.waterfallMaterial = this.createWaterfallMaterial();
    this.pondMaterial = this.createPondMaterial();

    this.character.traverse((child) => {
      if (!child.isMesh) return;

      if (child.name === "Waterfall") {
        child.material = this.waterfallMaterial;
      }

      if (child.name === "Pond") {
        child.geometry.computeBoundingBox();

        console.log("Pond Min:", child.geometry.boundingBox.min);
        console.log("Pond Max:", child.geometry.boundingBox.max);

        this.pondBounds.min.value.copy(child.geometry.boundingBox.min);
        this.pondBounds.max.value.copy(child.geometry.boundingBox.max);

        this.pondMaterial = this.createPondMaterial();
        child.material = this.pondMaterial;
      }
    });
  }

  createWaterfallMaterial() {
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = gradient();
    return material;
  }

  createPondMaterial() {
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = this.buildPondColorNode();
    return material;
  }

  hexToVec4(hex) {
    const color = new THREE.Color(hex);
    return vec4(color.r, color.g, color.b, 1);
  }

  buildPondColorNode() {
    // Gradient chain: Texture Coordinate → Mapping → Gradient
    const gradCoords = textureCoordinate(
      this.gradientSettings.coordType,
      this.pondBounds.min,
      this.pondBounds.max,
    );

    const gradMapped = mapping(
      gradCoords,
      vec3(
        this.gradientSettings.offsetX,
        this.gradientSettings.offsetY,
        this.gradientSettings.offsetZ,
      ),
      vec3(
        this.gradientSettings.scaleX,
        this.gradientSettings.scaleY,
        this.gradientSettings.scaleZ,
      ),
      vec3(
        this.gradientSettings.rotationX,
        this.gradientSettings.rotationY,
        this.gradientSettings.rotationZ,
      ),
    );

    const gradColor = gradient(
      gradMapped,
      this.hexToVec4(this.gradientSettings.colorA),
      this.hexToVec4(this.gradientSettings.colorB),
      this.gradientSettings.type,
    );

    // Voronoi chain: Texture Coordinate → Mapping → Animate → Voronoi
    const vorCoords = textureCoordinate(
      this.voronoiSettings.coordType,
      this.pondBounds.min,
      this.pondBounds.max,
    );
    const vorMapped = mapping(
      vorCoords,
      vec3(
        float(this.voronoiSettings.offsetX).add(this.voronoiAnimOffset.x),
        float(this.voronoiSettings.offsetY).add(this.voronoiAnimOffset.y),
        this.voronoiSettings.offsetZ,
      ),
      vec3(
        this.voronoiSettings.scaleX,
        this.voronoiSettings.scaleY,
        this.voronoiSettings.scaleZ,
      ),
      vec3(
        this.voronoiSettings.rotationX,
        this.voronoiSettings.rotationY,
        this.voronoiSettings.rotationZ,
      ),
    );

    const vor = voronoi(
      vorMapped.xz,
      float(this.voronoiSettings.subdivision),
      float(this.voronoiSettings.seed),
    );

    let t;
    if (this.voronoiSettings.output === "pointDistance") {
      t = vor.x.clamp(0, 1);
    } else if (this.voronoiSettings.output === "edgeApprox") {
      t = vor.y.clamp(0, 1);
    } else if (this.voronoiSettings.output === "edgeExact") {
      t = vor.z.clamp(0, 1);
    } else if (this.voronoiSettings.output === "seed") {
      t = vor.w.fract();
    }

    const remapped = mapRange(t, -0.18, 1.05, 0, 1, true);

    const vorColor = mix(
      this.hexToVec4(this.voronoiSettings.colorA),
      this.hexToVec4(this.voronoiSettings.colorB),
      remapped,
    );

    // Blend
    return blendMode(
      gradColor,
      vorColor,
      this.blendSettings.mode,
      this.blendSettings.factor,
    );
  }

  rebuildPondMaterial() {
    this.pondMaterial.colorNode = this.buildPondColorNode();
    this.pondMaterial.needsUpdate = true;
  }

  setupDebug() {
    const gui = new GUI();
    const pondFolder = gui.addFolder("Pond");

    // Gradient
    const gradFolder = pondFolder.addFolder("Gradient");

    const gradCoordFolder = gradFolder.addFolder("Texture Coordinate");
    gradCoordFolder
      .add(this.gradientSettings, "coordType", [
        "uv",
        "object",
        "generated",
        "normal",
      ])
      .name("Type")
      .onChange(() => this.rebuildPondMaterial());

    const gradMappingFolder = gradFolder.addFolder("Mapping");
    gradMappingFolder
      .add(this.gradientSettings, "offsetX", -2, 2, 0.01)
      .name("Offset X")
      .onChange(() => this.rebuildPondMaterial());
    gradMappingFolder
      .add(this.gradientSettings, "offsetY", -2, 2, 0.01)
      .name("Offset Y")
      .onChange(() => this.rebuildPondMaterial());
    gradMappingFolder
      .add(this.gradientSettings, "offsetZ", -2, 2, 0.01)
      .name("Offset Z")
      .onChange(() => this.rebuildPondMaterial());
    gradMappingFolder
      .add(this.gradientSettings, "scaleX", 0.1, 5, 0.01)
      .name("Scale X")
      .onChange(() => this.rebuildPondMaterial());
    gradMappingFolder
      .add(this.gradientSettings, "scaleY", 0.1, 5, 0.01)
      .name("Scale Y")
      .onChange(() => this.rebuildPondMaterial());
    gradMappingFolder
      .add(this.gradientSettings, "scaleZ", 0.1, 5, 0.01)
      .name("Scale Z")
      .onChange(() => this.rebuildPondMaterial());
    gradMappingFolder
      .add(this.gradientSettings, "rotationX", 0, Math.PI * 2, 0.01)
      .name("Rotation X")
      .onChange(() => this.rebuildPondMaterial());
    gradMappingFolder
      .add(this.gradientSettings, "rotationY", 0, Math.PI * 2, 0.01)
      .name("Rotation Y")
      .onChange(() => this.rebuildPondMaterial());
    gradMappingFolder
      .add(this.gradientSettings, "rotationZ", 0, Math.PI * 2, 0.01)
      .name("Rotation Z")
      .onChange(() => this.rebuildPondMaterial());

    const gradColorFolder = gradFolder.addFolder("Colors");
    gradColorFolder
      .addColor(this.gradientSettings, "colorA")
      .name("Color A")
      .onChange(() => this.rebuildPondMaterial());
    gradColorFolder
      .addColor(this.gradientSettings, "colorB")
      .name("Color B")
      .onChange(() => this.rebuildPondMaterial());
    gradColorFolder
      .add(this.gradientSettings, "type", [
        "linear",
        "quadratic",
        "easing",
        "radial",
      ])
      .name("Type")
      .onChange(() => this.rebuildPondMaterial());

    // Voronoi
    const vorFolder = pondFolder.addFolder("Voronoi");

    const vorCoordFolder = vorFolder.addFolder("Texture Coordinate");
    vorCoordFolder
      .add(this.voronoiSettings, "coordType", [
        "uv",
        "object",
        "generated",
        "normal",
      ])
      .name("Type")
      .onChange(() => this.rebuildPondMaterial());

    const vorMappingFolder = vorFolder.addFolder("Mapping");
    vorMappingFolder
      .add(this.voronoiSettings, "offsetX", -2, 2, 0.01)
      .name("Offset X")
      .onChange(() => this.rebuildPondMaterial());
    vorMappingFolder
      .add(this.voronoiSettings, "offsetY", -2, 2, 0.01)
      .name("Offset Y")
      .onChange(() => this.rebuildPondMaterial());
    vorMappingFolder
      .add(this.voronoiSettings, "offsetZ", -2, 2, 0.01)
      .name("Offset Z")
      .onChange(() => this.rebuildPondMaterial());
    vorMappingFolder
      .add(this.voronoiSettings, "scaleX", 0.1, 5, 0.01)
      .name("Scale X")
      .onChange(() => this.rebuildPondMaterial());
    vorMappingFolder
      .add(this.voronoiSettings, "scaleY", 0.1, 5, 0.01)
      .name("Scale Y")
      .onChange(() => this.rebuildPondMaterial());
    vorMappingFolder
      .add(this.voronoiSettings, "scaleZ", 0.1, 5, 0.01)
      .name("Scale Z")
      .onChange(() => this.rebuildPondMaterial());
    vorMappingFolder
      .add(this.voronoiSettings, "rotationX", 0, Math.PI * 2, 0.01)
      .name("Rotation X")
      .onChange(() => this.rebuildPondMaterial());
    vorMappingFolder
      .add(this.voronoiSettings, "rotationY", 0, Math.PI * 2, 0.01)
      .name("Rotation Y")
      .onChange(() => this.rebuildPondMaterial());
    vorMappingFolder
      .add(this.voronoiSettings, "rotationZ", 0, Math.PI * 2, 0.01)
      .name("Rotation Z")
      .onChange(() => this.rebuildPondMaterial());

    const vorParamsFolder = vorFolder.addFolder("Parameters");
    vorParamsFolder
      .add(this.voronoiSettings, "subdivision", 1, 20, 1)
      .name("Subdivision")
      .onChange(() => this.rebuildPondMaterial());
    vorParamsFolder
      .add(this.voronoiSettings, "seed", 0, 100, 0.1)
      .name("Seed")
      .onChange(() => this.rebuildPondMaterial());
    vorParamsFolder
      .add(this.voronoiSettings, "output", [
        "pointDistance",
        "edgeApprox",
        "edgeExact",
        "seed",
      ])
      .name("Output")
      .onChange(() => this.rebuildPondMaterial());

    const vorColorFolder = vorFolder.addFolder("Colors");
    vorColorFolder
      .addColor(this.voronoiSettings, "colorA")
      .name("Color A")
      .onChange(() => this.rebuildPondMaterial());
    vorColorFolder
      .addColor(this.voronoiSettings, "colorB")
      .name("Color B")
      .onChange(() => this.rebuildPondMaterial());

    const vorAnimFolder = vorFolder.addFolder("Animation");
    vorAnimFolder
      .add(this.voronoiSettings, "animSpeedX", -1, 1, 0.01)
      .name("Speed X")
      .onChange(() => this.rebuildPondMaterial());
    vorAnimFolder
      .add(this.voronoiSettings, "animSpeedY", -1, 1, 0.01)
      .name("Speed Y")
      .onChange(() => this.rebuildPondMaterial());

    // Blend
    const blendFolder = pondFolder.addFolder("Blend");
    blendFolder
      .add(this.blendSettings, "mode", [
        "mix",
        "add",
        "subtract",
        "multiply",
        "screen",
        "overlay",
        "difference",
        "divide",
      ])
      .name("Mode")
      .onChange(() => this.rebuildPondMaterial());
    blendFolder
      .add(this.blendSettings, "factor", 0, 1, 0.01)
      .name("Factor")
      .onChange(() => this.rebuildPondMaterial());
  }

  resize() {}

  update() {
    this.time.value += 0.005;
    this.voronoiAnimOffset.x.value += 0.003 * this.voronoiSettings.animSpeedX;
    this.voronoiAnimOffset.y.value += 0.003 * this.voronoiSettings.animSpeedY;
  }

  destroy() {}
}
