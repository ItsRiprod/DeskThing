import { Component } from 'react';
import styles from './Connected.module.scss';
import { pink, aubergine } from '@spotify-internal/encore-foundation';
import { SetupView } from 'store/SetupStore';

class Connected extends Component<{}, {}> {
  render() {
    return (
      <div
        className={styles.screen}
        style={{ background: aubergine }}
        data-testid={`${SetupView.CONNECTED}-screen`}
      >
        <div className={styles.title} style={{ color: pink }}>
          Connected
        </div>
        <div className={styles.subtitle} style={{ color: pink }}>
          Continue with setup in the Spotify app.
        </div>
      </div>
    );
  }
}

export default Connected;
