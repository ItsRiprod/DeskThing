// src/IframeComponent.tsx
import React, { useEffect } from 'react';

const IframeComponent: React.FC = () => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle incoming messages from the parent
      console.log('Received message from parent:', event);
      // Add your logic to handle the received data here

      // Example: Sending a response back to the parent
      if (event.source && event.origin) {
        (event.source as Window).postMessage(
          { type: 'RESPONSE_ACTION', payload: 'Response data from iframe' }, 
          event.origin
        );
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const sendMessageToParent = () => {
    window.parent.postMessage(
      { type: 'IFRAME_ACTION', payload: 'Some data from iframe' },
      '*'
    ); // Use a specific origin if possible for security
  };

  return (
    <div>
      <h1>IFrame Content</h1>
      <button onClick={sendMessageToParent}>Send Message to Parent</button>
    </div>
  );
};

export default IframeComponent;
