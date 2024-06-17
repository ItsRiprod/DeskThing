import React, { useEffect, useState, useRef } from 'react';
import { msToTime } from '../helpers/TimeUtils';

interface CountUpTimerProps {
  children;
  start: number;
  end: number;
  onSongEnd: () => void;
  onTouchEnd: (seconds: number) => void;
  handleSendCommand: (command: string) => void;
  play: boolean;
  onTouchStart: () => void;
}

const CountUpTimer: React.FC<CountUpTimerProps> = ({
  start,
  end,
  onSongEnd,
  onTouchEnd,
  handleSendCommand,
  play,
  children,
  onTouchStart,
}) => {
  const [ms, setMs] = useState(0);
  const [msEnd, setMsEnd] = useState(6000);
  const [touching, setTouching] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const myInterval = setInterval(() => {
      if (play) {
        if (ms < msEnd) {
          setMs((prev) => prev + 1000);
        } else {
          if (onSongEnd) {
            onSongEnd();
            setMs(0);
          }
        }
      }
    }, 1000);
    return () => clearInterval(myInterval);
  }, [play, ms, msEnd, onSongEnd]);

  useEffect(() => {
    if (start && end) {
      setMs(start);
      setMsEnd(end);
    }
  }, [start, end]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    onTouchStart();
    e.stopPropagation();

    const progressBar = progressBarRef.current;
    if (progressBar) {

      const rect = progressBar.getBoundingClientRect();
      let newMs = 0;
      setTouching(true);
      const handleTouchMove = (e: TouchEvent) => {
        const currentX = e.touches[0].clientX - rect.left;
        const curMs = Math.round((currentX / rect.width) * msEnd);
        setMs(curMs);
        newMs = curMs;
      };

      const handleTouchEnd = () => {
        if (newMs > 0) {
          if (newMs >= msEnd) {
            handleSendCommand('next_track');
            setMs(0);
          } else {
            onTouchEnd(newMs);
          }
        }
        setTouching(false);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
  };

  return (
    <div className="songInformation" onTouchStart={handleTouchStart}>
        {children}
      <div className="progressBar_container" ref={progressBarRef}>
        <div
          className="progressBar_progress"
          style={{
            width: `${(ms / msEnd) * 100 || 0}%`,
            transition: touching ? 'none' : 'width 1s ease-out',
          }}
          />
        <p className={`progressBar_timer ${touching ? '' : 'hidden'}`}>{msToTime(ms)}/{msToTime(msEnd)}</p>
      </div>
    </div>
  );
};

export default CountUpTimer;
