import { EventEmitter } from '../utility/eventEmitter'

class ErrorStore extends EventEmitter<string[]> {
  private errorList: string[]

  constructor() {
    super()
    this.errorList = []
  }

  public getErrors(): string[] {
    return this.errorList
  }

  public addError(error: string): void {
    this.errorList.push(error)
    this.emit('update', this.errorList)
  }
}

const errorInstance = new ErrorStore()

export default errorInstance
