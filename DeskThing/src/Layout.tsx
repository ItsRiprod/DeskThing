import { useEffect } from 'react';
import './index.css';
import { convertMouseToTouch } from './utils/simulateTouch';

export default function RootLayout({
  children,
}) {
  useEffect(() => {
    const element = document.getElementById('app');
    if (element) {
      convertMouseToTouch(element);
    }
  }, []);
  return (
    <div className={`font-geist`} id='app'>
      {children}
    </div>
  )
}