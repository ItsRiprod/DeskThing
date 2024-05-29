import { useState, useEffect } from 'react';
import { secondsFormat, secondsToMinutesFormat } from 'helpers/TimeUtils';

const CountUpTimer = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const myInterval = setInterval(() => {
      setSeconds(seconds + 1);
    }, 1000);
    return () => {
      clearInterval(myInterval);
    };
  });

  return (
    <>
      {secondsToMinutesFormat(seconds)}:{secondsFormat(seconds)}
    </>
  );
};

export default CountUpTimer;
