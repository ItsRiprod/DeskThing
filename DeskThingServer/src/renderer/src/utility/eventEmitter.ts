type Listener = (data: any) => void

export class EventEmitter {
  private events: { [key: string]: Listener[] } = {}

  public on(event: string, listener: Listener): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)
  }

  public off(event: string, listener: Listener): void {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter((l) => l !== listener)
  }

  public emit(event: string, data?: any): void {
    if (!this.events[event]) return
    this.events[event].forEach((listener) => listener(data))
  }
}
