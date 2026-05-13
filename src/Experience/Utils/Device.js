import * as THREE from "three/webgpu";

export class Device {
  constructor() {
    this.isMobileDevice =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
  }
}
