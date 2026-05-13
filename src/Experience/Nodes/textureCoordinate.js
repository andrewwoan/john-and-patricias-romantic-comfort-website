import { uv, positionLocal, normalLocal, vec3, float } from "three/tsl";

export function textureCoordinate(type = "uv", boxMin = null, boxMax = null) {
  if (type === "uv") {
    return vec3(uv(), 0);
  } else if (type === "generated") {
    if (boxMin && boxMax) {
      const size = boxMax.sub(boxMin);
      return positionLocal.sub(boxMin).div(size.add(0.0001));
    }
    return positionLocal;
  } else if (type === "object") {
    return positionLocal;
  } else if (type === "normal") {
    return normalLocal;
  }
}
