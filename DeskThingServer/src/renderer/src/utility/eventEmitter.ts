type Listener<T> = (data: T) => void

export class EventEmitter<Events extends Record<string, any>> {
  private events: { [K in keyof Events]?: Listener<Events[K]>[] } = {}

  public on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event]!.push(listener)
    return () => this.off(event, listener)
  }

  public off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    if (!this.events[event]) return
    this.events[event] = this.events[event]!.filter((l) => l !== listener)
  }

  public emit<K extends keyof Events>(event: K, data: Events[K]): void {
    if (!this.events[event]) return
    this.events[event]!.forEach((listener) => listener(data))
  }
}
