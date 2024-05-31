import styles from './Spinner.module.scss';

export enum SpinnerSize {
  SMALL,
  BIG,
}

export type Props = {
  size: SpinnerSize;
};

const sizeToAttributes = {
  [SpinnerSize.SMALL]: { sideLength: 32, strokeWidth: 25 },
  [SpinnerSize.BIG]: { sideLength: 104, strokeWidth: 15 },
};

const Spinner = ({ size }: Props) => (
  <div
    className={styles.spin}
    style={{
      width: sizeToAttributes[size].sideLength,
    }}
    data-testid="spinner"
  >
    <svg
      width={sizeToAttributes[size].sideLength}
      height={sizeToAttributes[size].sideLength}
      viewBox="0 0 200 200"
    >
      <circle
        className={styles.greenCircle}
        cx="100"
        cy="100"
        r="80"
        strokeWidth={sizeToAttributes[size].strokeWidth}
      />
    </svg>
  </div>
);

export default Spinner;
