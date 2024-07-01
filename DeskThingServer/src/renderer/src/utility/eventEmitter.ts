type Listener<T> = (data: T) => void

export class EventEmitter<T> {
  private events: { [key: string]: Listener<T>[] } = {}

  public on(event: string, listener: Listener<T>): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)
  }

  public off(event: string, listener: Listener<T>): void {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter((l) => l !== listener)
  }

  public emit(event: string, data?: T): void {
    if (!this.events[event]) return
    this.events[event].forEach((listener) => data && listener(data))
  }
}
