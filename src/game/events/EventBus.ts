import type { GameEventMap } from './EventTypes';

type Listener<T> = (data: T) => void;
type ListenerMap = { [K in keyof GameEventMap]?: Set<Listener<GameEventMap[K]>> };

/** Small typed publish/subscribe hub shared by Phaser scenes and React. */
class TypedEventBus {
  private listeners: ListenerMap = {};

  /** Subscribe. Returns a function that unsubscribes. */
  on<K extends keyof GameEventMap>(event: K, listener: Listener<GameEventMap[K]>): () => void {
    const set = (this.listeners[event] ??= new Set() as ListenerMap[K]) as Set<Listener<GameEventMap[K]>>;
    set.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof GameEventMap>(event: K, listener: Listener<GameEventMap[K]>): void {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends keyof GameEventMap>(
    event: K,
    ...args: GameEventMap[K] extends void ? [] : [data: GameEventMap[K]]
  ): void {
    const data = args[0] as GameEventMap[K];
    const set = this.listeners[event] as Set<Listener<GameEventMap[K]>> | undefined;
    if (!set) return;
    // Copy so listeners can unsubscribe while the event is being delivered.
    for (const listener of Array.from(set)) {
      try {
        listener(data);
      } catch (err) {
        console.error(`[EventBus] listener for ${String(event)} failed`, err);
      }
    }
  }
}

export const EventBus = new TypedEventBus();
