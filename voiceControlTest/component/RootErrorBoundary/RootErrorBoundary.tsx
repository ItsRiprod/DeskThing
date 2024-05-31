import styles from 'component/Modals/Modal.module.scss';
import { Component, PropsWithChildren } from 'react';
import { RootStoreProps } from 'store/RootStore';
import withStore from 'hocs/withStore';

type State = {
  counter: number;
  hasError: boolean;
};

class RootErrorBoundary extends Component<
  PropsWithChildren<RootStoreProps>,
  State
> {
  static getDerivedStateFromError(_error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, counter: 5 };
  }

  constructor(props) {
    super(props);
    this.state = { counter: 5, hasError: false };
  }

  componentDidCatch(error: Error, { componentStack }: React.ErrorInfo) {
    const { errorHandler } = this.props.store;

    error.stack = componentStack;

    errorHandler.logUnexpectedError(
      error,
      'Fatal UI error causing device restart: ',
    );

    window.setInterval(() => {
      this.setState({ counter: this.state.counter - 1 });
      if (this.state.counter <= 0) {
        window.location.reload();
      }
    }, 1000);
  }

  render() {
    return this.state.hasError ? (
      <div className={styles.dialog}>
        <div className={styles.title}>Something went wrong</div>
        <div className={styles.description}>
          <p>
            Restarting in {this.state.counter > 0 ? this.state.counter : 0}{' '}
            seconds
          </p>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default withStore(RootErrorBoundary);
