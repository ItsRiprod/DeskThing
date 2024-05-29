import Backtrace from 'helpers/Backtrace';
import InterappError from 'middleware/InterappError';
import InterappActions from 'middleware/InterappActions';
import { ErrorFilterFunction } from 'eventhandler/ErrorHandlerFilters';

export enum ErrorCategory {
  UNEXPECTED_ERROR = 'unexpected error',
  UNHANDLED_REJECTION = 'unhandled rejection',
  INTERAPP_ERROR = 'interapp error',
}

class ErrorHandler {
  interappActions: InterappActions;
  backtrace: Backtrace;
  sendLogs: boolean;
  error_log_filters: ErrorFilterFunction[];

  constructor(
    interappActions: InterappActions,
    backtrace: Backtrace,
    error_log_filters: ErrorFilterFunction[],
    sendLogs = true,
  ) {
    this.interappActions = interappActions;
    this.backtrace = backtrace;
    this.sendLogs = sendLogs;
    this.error_log_filters = error_log_filters;
  }

  private logBacktraceError = (error: Error) => {
    this.backtrace.reportError(error);
  };

  private logPitstopError = (error: Error, category: ErrorCategory) => {
    this.interappActions
      .pitstopLog({
        type: 'ui_error',
        timestamp: Date.now(),
        stacktrace: error.message,
        category: category,
      })
      .catch(() => {});
  };

  private logError = (error: Error, category: ErrorCategory) => {
    if (!this.error_log_filters.every((f) => f(error))) {
      return;
    }
    if (this.sendLogs) {
      this.logPitstopError(error, category);
      this.logBacktraceError(error);
    }
  };

  private logInterappError = (interappError: InterappError) => {
    this.logError(interappError, ErrorCategory.INTERAPP_ERROR);
  };

  logUnexpectedError = (error: Error, prefix?: string) => {
    error.message = prefix ? `${prefix}: ${error.message}` : error.message;
    if (error instanceof InterappError) {
      this.logInterappError(
        new InterappError(error.message, error.method, error.args),
      );
    } else {
      this.logError(error, ErrorCategory.UNEXPECTED_ERROR);
    }
  };

  onError = (e: ErrorEvent) => {
    e.preventDefault();
    e.stopPropagation();

    this.logUnexpectedError(e.error);
  };

  onUnhandledRejection = (e: PromiseRejectionEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Custom error payload/reason for interapp request failures
    if (e.reason.message && e.reason.method && e.reason.args) {
      this.logInterappError(
        new InterappError(e.reason.message, e.reason.method, e.reason.args),
      );
    } else {
      this.logError(
        new Error(`Promise rejected: ${e.reason.toString()}`),
        ErrorCategory.UNHANDLED_REJECTION,
      );
    }
  };
}

export default ErrorHandler;
