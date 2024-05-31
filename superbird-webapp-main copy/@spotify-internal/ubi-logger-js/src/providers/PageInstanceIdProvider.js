export class UBIPageInstanceIdProvider {
    _currentPageInstanceId = null;
    setPageInstanceId(pageInstanceId) {
        this._currentPageInstanceId = pageInstanceId;
    }
    getPageInstanceId() {
        return this._currentPageInstanceId;
    }
}
