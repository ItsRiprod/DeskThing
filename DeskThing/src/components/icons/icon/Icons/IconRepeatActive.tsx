
import IconRepeat from './IconRepeat';
interface Props {
  className?: string;
  iconSize: number;
  strokeWidth?: number;
}

const IconRepeatActive = ({ className, iconSize }: Props) => {
  return (
    <div style={{ width: `${iconSize}px` }}>
      <IconRepeat className={className} iconSize={iconSize} />
      <svg viewBox="0 0 48 11">
        <circle cx="24" cy="5" r="4" fill="white" />
      </svg>
    </div>
  );
};

export default IconRepeatActive;