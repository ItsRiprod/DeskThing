import React, { useEffect, useState } from 'react';
import { secondsFormat, secondsToMinutesFormat } from '../helpers/TimeUtils';

interface CountUpTimerProps {
  start: number;
  end: number;
  onSongEnd: () => void;
  play: boolean;
}

const CountUpTimer: React.FC<CountUpTimerProps> = ({ start, end, onSongEnd, play }) => {
  const [seconds, setSeconds] = useState(0);
  const [secondsEnd, setSecondsEnd] = useState(60);

  useEffect(() => {
    const myInterval = setInterval(() => {
      if (play) {
        if (seconds < secondsEnd) {
          setSeconds((prev) => prev + 1);
        } else {
          if (onSongEnd) {
            onSongEnd();
            setSeconds(0);
          }
        }
      }
    }, 1000);
    return () => clearInterval(myInterval);
  }, [play, seconds, secondsEnd, onSongEnd]);

  useEffect(() => {
    if (start && end) {
      const startInSeconds = Math.round(start / 1000);
      const endInSeconds = Math.round(end / 1000);
      setSeconds(startInSeconds);
      setSecondsEnd(endInSeconds);
      console.log(start + ' ' + end);
    }
  }, [start, end]);

  return (
    <div>
      <div
        className="progressBar_progress"
        style={{ width: `${(seconds / secondsEnd) * 100 || 0}%` }}
      />
      <p className="progressBar_timer">
        {secondsToMinutesFormat(seconds)}:{secondsFormat(seconds)}
      </p>
    </div>
  );
};

export default CountUpTimer;
