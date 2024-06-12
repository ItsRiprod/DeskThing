import React, { useEffect, useState, useRef } from 'react';
import { msToTime } from '../helpers/TimeUtils';

interface CountUpTimerProps {
  start: number;
  end: number;
  onSongEnd: () => void;
  onTouchEnd: (seconds: number) => void;
  handleSendCommand: (command: string) => void;
  play: boolean;
}

const CountUpTimer: React.FC<CountUpTimerProps> = ({
  start,
  end,
  onSongEnd,
  onTouchEnd,
  handleSendCommand,
  play,
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
    const progressBar = progressBarRef.current;
    if (progressBar) {
      const rect = progressBar.getBoundingClientRect();
      const startX = e.touches[0].clientX - rect.left;
      let newMs = 0;
      setTouching(true);
      const handleTouchMove = (e: TouchEvent) => {
        const currentX = e.touches[0].clientX - rect.left;
        const curMs = Math.round((currentX / rect.width) * msEnd);
        setMs(curMs);
        newMs = curMs;
      };

      const handleTouchEnd = () => {
        if (newMs >= msEnd) {
          handleSendCommand('next_track');
          setMs(0);
        } else {
          onTouchEnd(newMs);
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
    <div className="progressBar_container" ref={progressBarRef} onTouchStart={handleTouchStart}>
      <div
        className="progressBar_progress"
        style={{
          width: `${(ms / msEnd) * 100 || 0}%`,
          transition: touching ? 'none' : 'width 1s ease-out',
        }}
      />
      <p className="progressBar_timer">{msToTime(ms)}</p>
    </div>
  );
};

export default CountUpTimer;
