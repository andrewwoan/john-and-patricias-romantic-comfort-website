import { vec3, cos, sin } from "three/tsl";

export function mapping(
  input,
  offset = vec3(0, 0, 0),
  scale = vec3(1, 1, 1),
  rotation = vec3(0, 0, 0),
) {
  let mapped = input.sub(vec3(0.5, 0.5, 0.5));

  const cZ = cos(rotation.z);
  const sZ = sin(rotation.z);
  mapped = vec3(
    mapped.x.mul(cZ).sub(mapped.y.mul(sZ)),
    mapped.x.mul(sZ).add(mapped.y.mul(cZ)),
    mapped.z,
  );

  const cY = cos(rotation.y);
  const sY = sin(rotation.y);
  mapped = vec3(
    mapped.x.mul(cY).add(mapped.z.mul(sY)),
    mapped.y,
    mapped.x.negate().mul(sY).add(mapped.z.mul(cY)),
  );

  const cX = cos(rotation.x);
  const sX = sin(rotation.x);
  mapped = vec3(
    mapped.x,
    mapped.y.mul(cX).sub(mapped.z.mul(sX)),
    mapped.y.mul(sX).add(mapped.z.mul(cX)),
  );

  mapped = mapped.add(vec3(0.5, 0.5, 0.5));
  mapped = mapped.mul(scale).add(offset);

  return mapped;
}
