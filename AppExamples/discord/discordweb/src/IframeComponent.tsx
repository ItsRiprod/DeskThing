// src/IframeComponent.tsx
import React, { useEffect } from 'react';
import discordStore, { ACTION_TYPES } from './stores/discordStore';

interface IframeComponentProps {
  children: React.ReactNode;
}

const IframeComponent: React.FC<IframeComponentProps> = ({ children }) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Return if the message is not from the deskthing
      if (event.data.source != 'deskthing') return

      // Debugging
      console.log('Received message from parent:', event);
      
      discordStore.handleDiscordData(event.data.data);
    };


    const exampleUser ={
      avatar: "a_1d1d2950fdfaa97bdbb6044ce6c306bd",
      bot:false,
      profile: 'https://cdn.discordapp.com/avatars/395965311687327761/0ee510731bf0b755aa6aa127fcff8f0a.webp?size=80',
      discriminator:"0",
      flags:4194592,
      global_name:"Riprod",
      id:"276531165878288385",
      premium_type:2,
      username:"riprod"
    }

    const exampleData = {
        user: exampleUser,
        action: ACTION_TYPES.UPDATE
    }
    discordStore.handleDiscordData(exampleData);
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
      {children}
      <button className="absolute" onClick={sendMessageToParent}>Send Message to Parent</button>
    </div>
  );
};

export default IframeComponent;
