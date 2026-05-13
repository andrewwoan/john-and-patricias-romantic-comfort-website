import * as THREE from "three/webgpu";
import {
  uv,
  vec3,
  float,
  uniform,
  time,
  texture,
  dot,
  transformNormalToView,
  normalView,
  smoothstep,
  normalize,
  select,
  color as tslColor,
} from "three/tsl";

// Shared uniforms — one set for the whole scene so the GUI controls everything
export const hatchUniforms = {
  hatchScale: uniform(4.0),
  hatchStrength: uniform(0.7),
  shadowThreshold: uniform(0.5),
  shadowSoftness: uniform(0.1),
  permuteSpeed: uniform(2.0),
  channelBalanceR: uniform(0.63),
  channelBalanceG: uniform(1.0),
  channelBalanceB: uniform(3.0),
  channelContrastR: uniform(1.63),
  channelContrastG: uniform(1.0),
  channelContrastB: uniform(1.0),
  // World-space direction pointing FROM the surface TO the light.
  // Environment.js keeps this in sync with the directional light.
  lightDirectionWorld: uniform(vec3(0.5, 1.0, 0.3)),
};

let _hatchTexture = null;
function getHatchTexture() {
  if (_hatchTexture) return _hatchTexture;
  const loader = new THREE.TextureLoader();
  _hatchTexture = loader.load("/textures/crosshatch.png");
  _hatchTexture.wrapS = THREE.RepeatWrapping;
  _hatchTexture.wrapT = THREE.RepeatWrapping;
  _hatchTexture.colorSpace = THREE.NoColorSpace;
  return _hatchTexture;
}

/**
 * Build a hatched MeshStandardNodeMaterial.
 * @param {object} opts
 * @param {THREE.Color|number} [opts.color]  base tint (sRGB)
 * @param {THREE.Texture}      [opts.map]    optional albedo map (from the GLTF)
 */
export function createHatchedMaterial({ color = 0xffffff, map = null } = {}) {
  const material = new THREE.MeshStandardNodeMaterial({ color, map });

  // --- Lighting ---
  // Transform the world-space light direction into view space so it matches normalView.
  const lightDirView = normalize(
    transformNormalToView(hatchUniforms.lightDirectionWorld),
  );
  const lighting = dot(normalView, lightDirView).clamp(0, 1);

  const shadowMask = smoothstep(
    hatchUniforms.shadowThreshold.add(hatchUniforms.shadowSoftness),
    hatchUniforms.shadowThreshold.sub(hatchUniforms.shadowSoftness),
    lighting,
  );

  // --- Sample the hatching texture ---
  const hatchUV = uv().mul(hatchUniforms.hatchScale);
  const hatchSample = texture(getHatchTexture(), hatchUV);

  // --- Per-channel brightness + contrast adjustment ---
  const adjust = (channel, balance, contrast) =>
    channel.mul(balance).sub(0.5).mul(contrast).add(0.5);

  const balancedR = adjust(
    hatchSample.r,
    hatchUniforms.channelBalanceR,
    hatchUniforms.channelContrastR,
  );
  const balancedG = adjust(
    hatchSample.g,
    hatchUniforms.channelBalanceG,
    hatchUniforms.channelContrastG,
  );
  const balancedB = adjust(
    hatchSample.b,
    hatchUniforms.channelBalanceB,
    hatchUniforms.channelContrastB,
  );

  // --- Tick-based channel switching ---
  const tick = time.mul(hatchUniforms.permuteSpeed).floor();
  const channelIndex = tick.mod(3.0);
  const hatchValue = select(
    channelIndex.lessThan(0.5),
    balancedR,
    select(channelIndex.lessThan(1.5), balancedG, balancedB),
  );

  const hatchDarkness = float(1.0).sub(hatchValue);
  const hatchEffect = hatchDarkness
    .mul(shadowMask)
    .mul(hatchUniforms.hatchStrength);

  // --- Albedo in correct color space ---
  // tslColor() handles sRGB→linear conversion for both hex numbers and THREE.Color
  const tint = tslColor(color);
  const albedo = map ? texture(map).rgb.mul(tint) : tint;

  material.colorNode = albedo.mul(float(1.0).sub(hatchEffect));
  return material;
}
