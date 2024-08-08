import discordStore, { ACTION_TYPES } from "./discordStore";

type EventCallback = (data: any) => void;

class MessageStore {
  private listeners: EventCallback[] = [];

  constructor() {
    this.initialize();
    this.sendMessageToParent('server', 'message', undefined, 'Hello from the discord app!')
  }

  private initialize() {
    const exampleUser = {
      avatar: "a_1d1d2950fdfaa97bdbb6044ce6c306bd",
      bot: false,
      profile: 'https://cdn.discordapp.com/avatars/395965311687327761/0ee510731bf0b755aa6aa127fcff8f0a.webp?size=80',
      discriminator: "0",
      flags: 4194592,
      global_name: "Riprod",
      id: "276531165878288385",
      premium_type: 2,
      username: "riprod"
    };
    const exampleUser2 = {
      avatar: "a_1d1d2950fdfaa97bdbb6044ce6c306bd",
      bot: false,
      profile: 'https://cdn.discordapp.com/avatars/395965311687327761/0ee510731bf0b755aa6aa127fcff8f0a.webp?size=80',
      discriminator: "0",
      flags: 4194592,
      global_name: "Riprod",
      id: "429080671542181888",
      premium_type: 2,
      username: "riprod"
    };
    const exampleUser3 = {
      avatar: "a_1d1d2950fdfaa97bdbb6044ce6c306bd",
      bot: false,
      profile: 'https://cdn.discordapp.com/avatars/395965311687327761/0ee510731bf0b755aa6aa127fcff8f0a.webp?size=80',
      discriminator: "0",
      flags: 4194592,
      global_name: "Riprod",
      id: "825555063014555651",
      premium_type: 2,
      username: "riprod"
    };

    discordStore.handleDiscordData({ user: exampleUser, action: ACTION_TYPES.UPDATE });
    discordStore.handleDiscordData({ user: exampleUser2, action: ACTION_TYPES.UPDATE });
    discordStore.handleDiscordData({ user: exampleUser3, action: ACTION_TYPES.UPDATE });

    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent) {
    // Return if the message is not from the deskthing
    if (event.data.source !== 'deskthing') return;

    // Debugging
    console.log('Received message from parent:', event);

    discordStore.handleDiscordData(event.data.data);
    this.emit(event.data.data);
  }

  private emit(data: any) {
    this.listeners.forEach(listener => listener(data));
  }

  public addListener(callback: EventCallback) {
    this.listeners.push(callback);
    return () => this.removeListener(callback);
  }

  public removeListener(callback: EventCallback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  public sendMessageToParent(app?: string, request?: string, type?: string, data?: any) {
    const payload = {
      app: app || 'discord',
      type: type || 'message',
      request: request || null,
      data: data || null
    };
    window.parent.postMessage(
      { type: 'IFRAME_ACTION', payload: payload },
    );
  }
}

const messageStore = new MessageStore();
export default messageStore;
