import * as THREE from "three/webgpu";
import {
  vec3,
  float,
  mix,
  positionLocal,
  mx_fractal_noise_float,
  mx_worley_noise_float,
} from "three/tsl";

export function createTslPlaneMaterial() {
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.5 });

  const pos = positionLocal.mul(float(5.0));

  // Blender: Noise Texture, fBM, Scale 5, Detail 2, Roughness 0.5, Lacunarity 2
  // mx_fractal_noise_float outputs roughly [-1.5, 1.5] → remap to [0, 1]
  const noiseVal = mx_fractal_noise_float(pos, 2, 2.0, 0.5)
    .mul(0.5)
    .add(0.5)
    .clamp(0, 1);

  // Blender: Voronoi Texture, F1, Euclidean (metric=0), Scale 5, Randomness 1
  const voronoiVal = mx_worley_noise_float(pos, 1.0, 0).clamp(0, 1);

  // Blender: Mix node at Factor 0.5, Noise → A, Voronoi → B
  const mixed = mix(noiseVal, voronoiVal, 0.5);

  material.colorNode = vec3(mixed, mixed, mixed);

  return material;
}
