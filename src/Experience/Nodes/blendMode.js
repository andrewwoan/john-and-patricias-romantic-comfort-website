import { vec4, float, mix } from "three/tsl";

export function blendMode(base, layer, mode = "mix", factor = 0.5) {
  const fac = float(factor);
  const one = vec4(1, 1, 1, 1);

  let blended;

  if (mode === "mix") {
    blended = layer;
  } else if (mode === "add") {
    blended = base.add(layer);
  } else if (mode === "subtract") {
    blended = base.sub(layer);
  } else if (mode === "multiply") {
    blended = base.mul(layer);
  } else if (mode === "screen") {
    blended = one.sub(one.sub(base).mul(one.sub(layer)));
  } else if (mode === "overlay") {
    const dark = base.mul(layer).mul(2);
    const light = one.sub(one.sub(base).mul(one.sub(layer)).mul(2));
    const mask = base.step(0.5);
    blended = mix(dark, light, mask);
  } else if (mode === "difference") {
    blended = base.sub(layer).abs();
  } else if (mode === "divide") {
    blended = base.div(layer.max(0.001));
  } else {
    blended = layer;
  }

  return mix(base, blended, fac);
}
