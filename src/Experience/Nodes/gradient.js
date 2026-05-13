import { uv, vec3, vec4, mix } from "three/tsl";

export function gradient(
  inputCoords = vec3(uv(), 0),
  colorA = vec4(0, 0, 0, 1),
  colorB = vec4(1, 1, 1, 1),
  type = "linear",
) {
  const coords2D = inputCoords.xy;
  let t;

  if (type === "linear") {
    t = coords2D.x;
  } else if (type === "quadratic") {
    t = coords2D.x.mul(coords2D.x);
  } else if (type === "easing") {
    const raw = coords2D.x;
    t = raw.mul(raw).mul(raw.negate().mul(2).add(3));
  } else if (type === "radial") {
    t = coords2D.length().clamp(0, 1);
  }

  return mix(colorA, colorB, t);
}
