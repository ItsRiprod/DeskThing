import { Component, createRef } from 'react';
import { RootStoreProps } from 'store/RootStore';
import withStore from 'hocs/withStore';
import { transitionDurationMs } from '../../../style/Variables';
import { IReactionDisposer, reaction } from 'mobx';

const animationStates = {
  LISTENING: 'listening',
  THINKING: 'thinking',
  ERROR: 'error',
  LISTENING_TO_THINKING: 'listening_to_thinking',
  THINKING_TO_ERROR: 'thinking_to_error',
  LISTENING_TO_ERROR: 'listening_to_error',
  ERROR_TO_LISTENING: 'error_to_listening',
};

type Props = RootStoreProps;

type State = {
  disappearing: boolean;
  animationState: string;
};

type Wave = {
  thinking: {
    radius: number;
    lineWidth: number;
    color: string;
  };
  listening: {
    radius: number;
    amplitude: number;
    frequency: number;
    phaseMultiplier: number;
    lineWidth: number;
    color: string;
  };
  error: {
    color: string;
    radius: number;
    lineWidth: number;
  };
};

interface RenderArgs {
  wave: Wave;
  t: number;
  degree: number;
}

class Jellyfish extends Component<Props, State> {
  renderCanvasRequestId?: number;

  SIXTY_FPS_UPDATE_INTERVAL_MS = 1000 / 60;

  listeningRadius = 72;
  W = 150;
  H = 156;
  cx = this.W / 2;
  cy = this.listeningRadius + 6;
  canvasRef: any;
  listeningRotationSpeed = 0.02;
  thinkingSpeed = 0.18;
  thinkingTravel = 8;
  phase = 5;

  transitionStart = 0;
  transitionTimeoutId?: number;
  waves: Wave[] = [
    {
      thinking: {
        radius: 62,
        lineWidth: 6,
        color: 'rgba(31, 214, 97, 1)',
      },
      listening: {
        radius: this.listeningRadius,
        amplitude: 14,
        frequency: 3.3,
        phaseMultiplier: 1,
        lineWidth: 6,
        color: 'rgba(30, 215, 96, 1)',
      },
      error: {
        color: 'rgb(255, 200, 100, 1)',
        radius: 40,
        lineWidth: 10,
      },
    },
    {
      thinking: {
        radius: 47,
        lineWidth: 6,
        color: 'rgba(31, 214, 189, 1)',
      },
      listening: {
        radius: this.listeningRadius,
        amplitude: 6,
        frequency: 3.3,
        phaseMultiplier: 1,
        lineWidth: 6,
        color: 'rgba(30, 215, 188, 0.8)',
      },
      error: {
        radius: 40,
        lineWidth: 10,
        color: 'rgb(255, 200, 100, 0)',
      },
    },
    {
      thinking: {
        radius: 30,
        lineWidth: 6,
        color: 'rgba(31, 148, 214, 1)',
      },
      listening: {
        radius: this.listeningRadius,
        amplitude: 1,
        frequency: 1,
        phaseMultiplier: 1,
        lineWidth: 6,
        color: 'rgba(31, 148, 214, 0.5)',
      },
      error: {
        radius: 40,
        lineWidth: 10,
        color: 'rgb(255, 200, 100, 0)',
      },
    },
  ];

  micLevel = 0;
  thinking = false;
  error: string | undefined;
  micPan = 0;

  micLevelDisposer: IReactionDisposer | undefined;
  thinkingDisposer: IReactionDisposer | undefined;
  errorDisposer: IReactionDisposer | undefined;
  micPanDisposer: IReactionDisposer | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      disappearing: false,
      animationState: animationStates.LISTENING,
    };
    this.canvasRef = createRef();
  }

  componentDidMount() {
    this.micLevelDisposer = reaction(
      () => this.props.store.voiceStore.micLevelMovingAverage,
      (value) => (this.micLevel = value),
    );

    this.thinkingDisposer = reaction(
      () => this.props.store.voiceStore.thinking,
      (value) => (this.thinking = value),
    );

    this.errorDisposer = reaction(
      () => this.props.store.voiceStore.error,
      (value) => (this.error = value),
    );

    this.micPanDisposer = reaction(
      () => this.props.store.voiceStore.state.micPan,
      (value) => (this.micPan = value),
    );

    this.startAnimation();
  }

  componentWillUnmount(): void {
    if (this.renderCanvasRequestId) {
      cancelAnimationFrame(this.renderCanvasRequestId);
    }
    this.renderCanvasRequestId = undefined;
    window.clearTimeout(this.transitionTimeoutId);

    if (this.micLevelDisposer) this.micLevelDisposer();
    if (this.thinkingDisposer) this.thinkingDisposer();
    if (this.errorDisposer) this.errorDisposer();
    if (this.micPanDisposer) this.micPanDisposer();
  }

  isCurrentlyTransitioning(): boolean {
    return [
      animationStates.LISTENING_TO_THINKING,
      animationStates.THINKING_TO_ERROR,
      animationStates.LISTENING_TO_ERROR,
      animationStates.ERROR_TO_LISTENING,
    ].includes(this.state.animationState);
  }

  maybeUpdateState(t: number): void {
    if (
      this.state.animationState === animationStates.LISTENING &&
      this.thinking
    ) {
      this.setState({
        animationState: animationStates.LISTENING_TO_THINKING,
      });
      this.transitionStart = t;
      this.startTransitionTimeout(animationStates.THINKING);
    } else if (
      this.state.animationState === animationStates.THINKING &&
      this.error
    ) {
      this.setState({ animationState: animationStates.THINKING_TO_ERROR });
      this.transitionStart = t;
      this.startTransitionTimeout(animationStates.ERROR);
    } else if (
      this.state.animationState === animationStates.LISTENING &&
      this.error
    ) {
      this.setState({ animationState: animationStates.LISTENING_TO_ERROR });
      this.transitionStart = t;
      this.startTransitionTimeout(animationStates.ERROR);
    } else if (
      this.state.animationState === animationStates.ERROR &&
      !this.error
    ) {
      this.setState({ animationState: animationStates.ERROR_TO_LISTENING });
      this.transitionStart = t;
      this.startTransitionTimeout(animationStates.LISTENING);
    }
  }

  startTransitionTimeout(animationState: any) {
    window.clearTimeout(this.transitionTimeoutId);
    this.transitionTimeoutId = window.setTimeout(() => {
      this.setState({ animationState: animationState });
    }, transitionDurationMs);
  }

  easeOutExpo(x: number): number {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  getTransitionPercentage(t: number): number {
    if (this.isCurrentlyTransitioning()) {
      const dt = t - this.transitionStart;
      return dt / (transitionDurationMs / this.SIXTY_FPS_UPDATE_INTERVAL_MS);
    }

    return 0;
  }

  transition(a: number, b: number, t: number): number {
    return a + this.easeOutExpo(this.getTransitionPercentage(t)) * (b - a);
  }

  getListeningRadius({ wave, degree }: RenderArgs): number {
    const {
      store: { voiceStore },
    } = this.props;
    const adjustedPhase = this.phase * wave.listening.phaseMultiplier;

    const adjustedAmplitude =
      wave.listening.amplitude * (1 + voiceStore.micLevelMovingAverage * 2);

    return this.warpedRadius(
      degree,
      wave.listening.radius,
      wave.listening.frequency,
      adjustedPhase,
      adjustedAmplitude,
    );
  }

  warpedRadius(
    degree: number,
    radius: number,
    frequency: number,
    phase: number,
    amplitude: number,
  ): number {
    const x = (degree - 100) / radius;
    return (
      radius -
      this.getActivation(x) *
        (amplitude + amplitude * Math.sin(x * frequency - phase))
    );
  }

  getActivation(x: number): number {
    // only getActivation waves along certain parts of the circle with smooth fade to non wavy parts.
    return Math.pow(20 / (20 + Math.pow(x * 2.8, 4)), 2);
  }

  getThinkingRadius({ wave, t }: RenderArgs): number {
    const tick = t * this.thinkingSpeed;
    const radiusOffset =
      tick % (2 * this.thinkingTravel) < this.thinkingTravel
        ? tick % this.thinkingTravel
        : this.thinkingTravel - (tick % this.thinkingTravel);

    return wave.thinking.radius + radiusOffset;
  }

  getRadius(args: RenderArgs) {
    const { wave, t } = args;
    switch (this.state.animationState) {
      case animationStates.LISTENING_TO_THINKING:
        return this.transition(
          this.getListeningRadius(args),
          this.getThinkingRadius(args),
          t,
        );
      case animationStates.LISTENING:
        return this.getListeningRadius(args);
      case animationStates.THINKING:
        return this.getThinkingRadius(args);
      case animationStates.THINKING_TO_ERROR:
        return this.transition(
          this.getThinkingRadius(args),
          wave.error.radius,
          t,
        );
      case animationStates.ERROR:
        return wave.error.radius;
      case animationStates.LISTENING_TO_ERROR:
        return this.transition(
          this.getListeningRadius(args),
          wave.error.radius,
          t,
        );
      case animationStates.ERROR_TO_LISTENING:
        return this.transition(
          wave.error.radius,
          this.getListeningRadius(args),
          t,
        );
      default:
        throw new Error('radius default');
    }
  }

  getLineWidth({ wave, t }: Omit<RenderArgs, 'degree'>): number {
    switch (this.state.animationState) {
      case animationStates.LISTENING_TO_THINKING:
        return this.transition(
          wave.listening.lineWidth,
          wave.thinking.lineWidth,
          t,
        );
      case animationStates.LISTENING:
        return wave.listening.lineWidth;
      case animationStates.THINKING:
        return wave.thinking.lineWidth;
      case animationStates.THINKING_TO_ERROR:
        return this.transition(
          wave.thinking.lineWidth,
          wave.error.lineWidth,
          t,
        );
      case animationStates.ERROR:
        return wave.error.lineWidth;
      case animationStates.LISTENING_TO_ERROR:
        return this.transition(
          wave.listening.lineWidth,
          wave.error.lineWidth,
          t,
        );
      case animationStates.ERROR_TO_LISTENING:
        return this.transition(
          wave.error.lineWidth,
          wave.listening.lineWidth,
          t,
        );
      default:
        throw new Error('lineWidth default');
    }
  }

  getColor({ wave, t }: Omit<RenderArgs, 'degree'>): string {
    const getIntermediateColor = (c1: string, c2: string) => {
      const rgbaExtractor = /([\d.]+)/g;

      const c1Parsed: Array<number> = (c1.match(rgbaExtractor) || []).map(
        parseFloat,
      );
      const c2Parsed: Array<number> = (c2.match(rgbaExtractor) || []).map(
        parseFloat,
      );
      const currentColors = c1Parsed.map((channel1, index) =>
        this.transition(channel1, c2Parsed[index], t),
      );

      return `rgb(${currentColors.join(', ')})`;
    };

    switch (this.state.animationState) {
      case animationStates.LISTENING_TO_THINKING:
        return getIntermediateColor(wave.listening.color, wave.thinking.color);
      case animationStates.LISTENING:
        return wave.listening.color;
      case animationStates.THINKING:
        return wave.thinking.color;
      case animationStates.THINKING_TO_ERROR:
        return getIntermediateColor(wave.thinking.color, wave.error.color);
      case animationStates.ERROR:
        return wave.error.color;
      case animationStates.LISTENING_TO_ERROR:
        return getIntermediateColor(wave.listening.color, wave.error.color);
      case animationStates.ERROR_TO_LISTENING:
        return getIntermediateColor(wave.error.color, wave.listening.color);
      default:
        throw new Error('color default');
    }
  }

  startAnimation() {
    const current = this.canvasRef.current;
    const ctx = current.getContext('2d', { alpha: true });
    ctx.globalCompositeOperation = 'destination-over';

    const renderCanvas = (timestamp: number) => {
      const {
        store: { voiceStore },
      } = this.props;

      if (!current) {
        return;
      }

      const t = timestamp / this.SIXTY_FPS_UPDATE_INTERVAL_MS;

      ctx.clearRect(0, 0, this.W, this.H); // clear canvas

      this.phase =
        (this.phase +
          Math.PI * this.listeningRotationSpeed +
          voiceStore.micLevelMovingAverage * 0.5) %
        (2 * Math.PI);

      this.waves.forEach((wave) => {
        ctx.lineWidth = this.getLineWidth({ wave, t });
        ctx.strokeStyle = this.getColor({ wave, t });
        ctx.beginPath();

        for (let degree = 0; degree <= 360; degree++) {
          const currentRadius = this.getRadius({ wave, t, degree });

          const offset = this.getOffset(1);
          const x = this.getX(this.cx, degree - offset, currentRadius);
          const y = this.getY(this.cy, degree - offset, currentRadius);

          if (degree === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      this.maybeUpdateState(t);
      if (this.renderCanvasRequestId) {
        this.renderCanvasRequestId = requestAnimationFrame(renderCanvas);
      }
    };

    this.renderCanvasRequestId = requestAnimationFrame(renderCanvas);
  }

  radians(d: number): number {
    return (d * Math.PI) / 180;
  }

  getX(c: number, d: number, r: number): number {
    return c + r * Math.cos(this.radians(d));
  }

  getY(c: number, d: number, r: number): number {
    return c + r * Math.sin(this.radians(d));
  }

  getOffset(direction: number) {
    // map the direction to numbers between -6 and 102 as it goes from -1 to 1
    return 54 * direction + 48;
  }

  render() {
    return <canvas ref={this.canvasRef} width={this.W} height={this.H} />;
  }
}

export default withStore(Jellyfish);
