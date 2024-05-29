/* eslint @typescript-eslint/no-explicit-any: 0 */
import { Component, ReactNode } from 'react';

type State = {
  showing: boolean;
};

type Props = {
  showDelay?: number;
  hideDelay?: number;
  showing: boolean;
  children: /*Record<string, any>*/ ReactNode; // I have no idea why Record<string, any> was the type for children in the original source
};

class DelayedRender extends Component<Props, State> {
  timeoutId?: number;

  constructor(props: Props) {
    super(props);
    this.state = {
      showing: props.showing,
    };
  }

  componentDidUpdate(prevProps: Props) {
    this.maybeUpdateState(prevProps, this.props);
  }

  componentWillUnmount() {
    window.clearTimeout(this.timeoutId);
  }

  maybeUpdateState(prevProps: Props, currentProps: Props) {
    if (!prevProps.showing && currentProps.showing) {
      window.clearTimeout(this.timeoutId);
      if (!this.props.showDelay) {
        this.setState({ showing: true });
      } else {
        this.timeoutId = window.setTimeout(
          () => this.setState({ showing: true }),
          this.props.showDelay,
        );
      }
    }

    if (prevProps.showing && !currentProps.showing) {
      window.clearTimeout(this.timeoutId);
      if (!this.props.hideDelay) {
        this.setState({ showing: false });
      } else {
        this.timeoutId = window.setTimeout(
          () => this.setState({ showing: false }),
          this.props.hideDelay,
        );
      }
    }
  }

  render() {
    return this.state.showing ? this.props.children : null;
  }
}

export default DelayedRender;
