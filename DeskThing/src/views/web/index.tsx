import React, { useEffect, useRef, useState } from 'react'
import socket, { socketData } from '../../helpers/WebSocketService'

interface WebViewProps {
  currentView: string
}

const WebView: React.FC<WebViewProps> = ({ currentView }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [swipeVisible, setSwipeVisible] = useState(false)
  const swipeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle incoming messages from the iframe
      if (event.origin != 'http://localhost:8891') return

      console.log('Received message from iframe:', event)
      // Add your logic to handle the received data here
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const sendMessageToIframe = (data: any) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(data, '*');
    }
  };

  useEffect(() => {
    console.log(currentView)
    const routeData = (data: socketData) => {
        console.log(data)
        const augmentedData = { ...data, source: 'deskthing' }
        sendMessageToIframe(augmentedData)
    }

    const removeListener = socket.on(currentView, (data) => routeData(data))

    return () => {
      removeListener()
    }
  })

  const handleTouchStart = () => {
    setSwipeVisible(true)
  }

  const handleTouchEnd = () => {
    setTimeout(() => {
      setSwipeVisible(false)
    }, 4000)
  }

  return (
    <div className='max-h-screen h-screen pb-14 overflow-hidden'>
        <div className="touch-none w-full h-0 flex justify-center bg-red-200">
            <div
              ref={swipeRef}
              className={`touch-auto fixed h-10 rounded-2xl top-2 bg-gray-900 ${
                swipeVisible ? 'opacity-100 w-11/12 h-4/6 text-6xl content-center' : 'opacity-30 w-1/4'
              } transition-all duration-300`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {swipeVisible ? 'Swipe' : ''}
            </div>
        </div>
        <iframe
          ref={iframeRef}
          src={`http://localhost:8891/${currentView}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Web View"
        />
        
    </div>
  )
}

export default WebView
