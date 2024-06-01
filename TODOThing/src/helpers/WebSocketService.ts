import useWebSocket, { ReadyState } from 'react-use-websocket';

export const useWebSocketService = () => {
  const { sendMessage, lastMessage, readyState } = useWebSocket('ws://localhost:8891', {
    onOpen: () => console.log('Connected to WebSocket server'),
    onMessage: (event) => {
      // Handle incoming messages
    },
    onError: (event) => console.error('WebSocket error: ', event),
    shouldReconnect: () => true,
  });

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  // Other WebSocket-related functions

  return {
    sendMessage: handleSendMessage,
    lastMessage,
    readyState,
    // Other exported functions or properties
  };
};
