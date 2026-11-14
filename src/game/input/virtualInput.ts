/**
 * Input coming from the on-screen touch controls. The React interface writes
 * to it; the active Phaser scene reads it every frame alongside the keyboard.
 */
const state = { x: 0, y: 0, interactQueued: false };

/** Set the joystick direction. Each axis is -1..1. */
export function setVirtualAxis(x: number, y: number): void {
  state.x = Math.max(-1, Math.min(1, x));
  state.y = Math.max(-1, Math.min(1, y));
}

export function getVirtualAxis(): { x: number; y: number } {
  return state;
}

/** Ask the scene to perform the current interaction on its next frame. */
export function queueInteract(): void {
  state.interactQueued = true;
}

/** Returns true once for each queued interaction. */
export function consumeInteract(): boolean {
  const queued = state.interactQueued;
  state.interactQueued = false;
  return queued;
}

export function resetVirtualInput(): void {
  state.x = 0;
  state.y = 0;
  state.interactQueued = false;
}
