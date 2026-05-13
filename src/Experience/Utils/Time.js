import { EventEmitter } from "events";

export class Time extends EventEmitter {
  constructor() {
    super();

    this.start = performance.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16;

    this.stepFPS = 6;
    this.stepInterval = 1000 / this.stepFPS; // ms
    this.lastStepTime = 0;
    this.isStepFrame = false;
    this.stepDelta = 0;

    window.requestAnimationFrame(() => this.tick());
  }

  setStepFPS(fps) {
    this.stepFPS = fps;
    this.stepInterval = 1000 / fps;
  }

  shouldStep() {
    return this.isStepFrame;
  }

  tick() {
    const currentTime = performance.now();
    this.delta = currentTime - this.current;
    this.current = currentTime;
    this.elapsed = currentTime - this.start;

    if (this.elapsed - this.lastStepTime >= this.stepInterval) {
      this.isStepFrame = true;
      this.stepDelta = this.elapsed - this.lastStepTime;
      this.lastStepTime = this.elapsed;
    } else {
      this.isStepFrame = false;
    }

    this.emit("update");

    window.requestAnimationFrame(() => this.tick());
  }
}
