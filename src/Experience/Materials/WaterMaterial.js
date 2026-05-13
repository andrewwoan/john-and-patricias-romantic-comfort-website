import * as THREE from "three/webgpu";
import {
  vec3,
  vec4,
  float,
  mix,
  normalize,
  positionLocal,
  time,
  modelViewMatrix,
  mx_fractal_noise_float,
} from "three/tsl";

// Matches Blender animation: 480 frames @ 24fps = 20s loop
// Two 4D FBM noises share the same spatial coords but have offset W (time) values.
// At the loop end, noise2's W == noise1's starting W → seamless crossfade.
const LOOP_SECONDS = 20.0;
const W_SPEED = 450.0 / 24.0;    // frame divisor → seconds (18.75s)
const W_OFFSET = 480.0 / 450.0;  // phase gap between layers (~1.067)
const FADE_START = 400.0 / 24.0; // crossfade begins at ~16.67s
const FADE_RANGE = 60.0 / 24.0;  // crossfade lasts 2.5s
const NOISE_SCALE = 5.0;
const BUMP_DIST = 0.53;
const EPS = 0.01;

export function createWaterMaterial() {
  const loopTime = time.mod(float(LOOP_SECONDS));

  const w1 = loopTime.div(float(W_SPEED));
  const w2 = w1.sub(float(W_OFFSET));
  const blend = loopTime.sub(float(FADE_START)).div(float(FADE_RANGE)).clamp(0, 1);

  // Spatial position scaled for noise (Blender Scale=5)
  // positionLocal is in XZ plane (geometry has baked -90° X rotation)
  const scaledPos = positionLocal.mul(float(NOISE_SCALE));
  const eps = float(EPS);

  // 4D FBM sample blended between two temporally offset layers
  function sampleHeight(p) {
    const h1 = mx_fractal_noise_float(vec4(p.x, p.y, p.z, w1), 2, 2.0, 0.5)
      .mul(0.5).add(0.5).clamp(0, 1);
    const h2 = mx_fractal_noise_float(vec4(p.x, p.y, p.z, w2), 2, 2.0, 0.5)
      .mul(0.5).add(0.5).clamp(0, 1);
    return mix(h1, h2, blend);
  }

  // Finite differences for bump→normal (Y-up XZ plane)
  const h0 = sampleHeight(scaledPos);
  const hX = sampleHeight(scaledPos.add(vec3(EPS, 0, 0)));
  const hZ = sampleHeight(scaledPos.add(vec3(0, 0, EPS)));

  const dhdx = hX.sub(h0).div(eps).mul(float(BUMP_DIST));
  const dhdz = hZ.sub(h0).div(eps).mul(float(BUMP_DIST));

  // Y-up perturbed normal in local space → transform to view space for normalNode
  const localNormal = normalize(vec3(dhdx.negate(), float(1.0), dhdz.negate()));
  const viewNormal = modelViewMatrix.transformDirection(localNormal).normalize();

  const material = new THREE.MeshPhysicalNodeMaterial({
    color: 0x1a3a5c,
    roughness: 0.0,
    metalness: 0.0,
  });

  material.normalNode = viewNormal;

  return material;
}
