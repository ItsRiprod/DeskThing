export interface PageInstanceIdProvider {
  getPageInstanceId(): string | null;
  setPageInstanceId(pageInstanceId: string): void;
}

export class UBIPageInstanceIdProvider implements PageInstanceIdProvider {
  private _currentPageInstanceId: string | null = null;

  setPageInstanceId(pageInstanceId: string): void {
    this._currentPageInstanceId = pageInstanceId;
  }
  getPageInstanceId(): string | null {
    return this._currentPageInstanceId;
  }
}
