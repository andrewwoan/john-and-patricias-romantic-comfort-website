import { float } from "three/tsl";

export function mapRange(
  value,
  fromMin = 0,
  fromMax = 1,
  toMin = 0,
  toMax = 1,
  clamp = true,
) {
  const v = float(value);
  const fMin = float(fromMin);
  const fMax = float(fromMax);
  const tMin = float(toMin);
  const tMax = float(toMax);

  // Normalize to 0–1 range, then remap
  let t = v.sub(fMin).div(fMax.sub(fMin).add(0.00001)); // epsilon to avoid div by zero

  if (clamp) {
    t = t.clamp(0, 1);
  }

  return tMin.add(t.mul(tMax.sub(tMin)));
}
