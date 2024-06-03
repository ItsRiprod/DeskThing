const BASE_URL = 'ws://localhost:8891';

type SocketEventListener = (msg: any) => void;

export function create_socket(): WebSocket {
  return new WebSocket(BASE_URL);
}

class WebSocketService {
  socket_connector: () => WebSocket;
  listeners: SocketEventListener[] = [];
  webSocket: WebSocket;

  constructor(socket_connector: () => WebSocket = create_socket) {
    this.socket_connector = socket_connector;

    this.webSocket = this.socket_connector();
    this.connect(this.webSocket);
  }

  reconnect(): void {
    this.connect(this.socket_connector());
  }

  connect(webSocket: WebSocket): void {
    this.webSocket = webSocket;
    // browser socket, WebSocket IPC transport
    webSocket.onopen = (): void => {
      this.registerEventHandler();
    };

    webSocket.onclose = () => {
      setTimeout(this.reconnect.bind(this), 1000);
      return;
    };
    webSocket.onerror = () => {
      setTimeout(this.reconnect.bind(this), 1000);
      return;
    };
  }

  is_ready(): boolean {
    return this.webSocket.readyState > 0;
  }

  post(body: Record<string, any>): void {
    this.webSocket.send(JSON.stringify(body));
  }

  registerEventHandler = (): void => {
    this.webSocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data.toString());
        this.listeners.forEach((listener: SocketEventListener) => listener(msg));
      } catch (e) {
        console.error(e);
      }
    };
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  addSocketEventListener(listener: SocketEventListener) {
    this.listeners.push(listener);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  removeSocketEventListener(listener: SocketEventListener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
}

const socket = new WebSocketService();
export default socket;

export type device_data = {
  is_playing: boolean;
  device: {
    id: string;
    name: string;
    is_active: boolean;
    volume_percent: number;
  };
};
export type song_data = {
  photo: string;
  duration_ms: number;
  name: string;
  progress_ms: number;
  is_playing: boolean;
  artistName: string;
  uri: string;
  playlistUri: string;
};

export type board_data = [
  {
    closed: boolean;
    creationMethod: string;
    dateClosed: string | null;
    dateLastActivity: string;
    dateLastView: string;
    datePluginDisable: string | null;
    desc: string;
    descData: string | null;
    enterpriseOwned: boolean;
    id: string;
    idBoardSource: string | null;
    idEnterprise: string | null;
    idMemberCreator: string;
    idOrganization: string;
    idTags: string[];
    ixUpdate: string;
    labelNames: {
      green: string;
      yellow: string;
      orange: string;
      red: string;
      purple: string;
      blue: string;
      sky: string;
      lime: string;
      pink: string;
      black: string;
    };
    limits: {
      attachments: {
        perCard: {
          status: string;
          disableAt: number;
          warnAt: number;
        };
        perBoard: {
          status: string;
          disableAt: number;
          warnAt: number;
        };
      };
      boards: {
        totalMembersPerBoard: {
          status: string;
          disableAt: number;
          warnAt: number;
        };
        totalMembersPerWorkspace: {
          status: string;
          disableAt: number;
          warnAt: number;
        };
      };
      cards: {
        openPerBoard: {
          status: string;
          disableAt: number;
          warnAt: number;
        };
        openPerList: {
          status: string;
          disableAt: number;
          warnAt: number;
        };
        totalPerBoard: {
          status: string;
          disableAt: number;
          warnAt: number;
        };
      };
      checklists: {
        perCard: {
          status: string;
          disableAt: number;
          warnAt: number;
        };
      };
      checkItems: {
        perChecklist: {
          status: string;
          disableAt: number;
          warnAt: number;
        };
      };
    };
    memberships: {
      id: string;
      idMember: string;
      memberType: string;
      unconfirmed: boolean;
      deactivated: boolean;
    }[];
    name: string;
    nodeId: string;
    pinned: boolean;
    powerUps: string[];
    prefs: {
      permissionLevel: string;
      hideVotes: boolean;
      voting: string;
      comments: string;
      invitations: string;
      selfJoin: boolean;
      cardCovers: boolean;
      isTemplate: boolean;
      cardAging: string;
      calendarFeedEnabled: boolean;
      background: string;
      backgroundColor: string | null;
      backgroundImage: string | null;
      backgroundImageScaled:
        | {
            width: number;
            height: number;
            url: string;
          }[]
        | null;
      backgroundTile: boolean;
      backgroundBrightness: string;
      backgroundBottomColor: string | null;
      backgroundTopColor: string | null;
      canBePublic: boolean;
      canBeEnterprise: boolean;
      canBeOrg: boolean;
      canBePrivate: boolean;
      canInvite: boolean;
    };
    premiumFeatures: string[];
    shortLink: string;
    shortUrl: string;
    starred: boolean;
    subscribed: boolean;
    templateGallery: string | null;
    url: string;
  }
];

export type list_data = [
  {
    closed: boolean;
    color: string | null;
    id: string;
    idBoard: string;
    name: string;
    pos: number;
    softLimit: any; // or null if you want to be more specific
    subscribed: boolean;
  }
];

interface Badge {
  attachmentsByType: {
    trello: {
      board: number;
      card: number;
    };
  };
  location: boolean;
  votes: number;
  viewingMemberVoted: boolean;
  subscribed: boolean;
  fogbugz: string;
  checkItems: number;
  checkItemsChecked: number;
  comments: number;
  attachments: number;
  description: boolean;
  due: string;
  start: string;
  dueComplete: boolean;
}

interface DescData {
  emoji: Record<string, unknown>;
}

interface Checklist {
  id: string;
}

interface Label {
  id: string;
  idBoard: string;
  name: string;
  color: string;
}

interface Limits {
  attachments: {
    perBoard: Record<string, unknown>;
  };
}

interface Cover {
  color: string;
  idUploadedBackground: boolean;
  size: string;
  brightness: string;
  isTemplate: boolean;
}

interface BoardDataItem {
  id: string;
  address: string;
  badges: Badge;
  checkItemStates: string[];
  closed: boolean;
  coordinates: string;
  creationMethod: string;
  dateLastActivity: string;
  desc: string;
  descData: DescData;
  due: string;
  dueReminder: string;
  idBoard: string;
  idChecklists: Checklist[];
  idLabels: Label[];
  idList: string;
  idMembers: string[];
  idMembersVoted: string[];
  idShort: number;
  labels: string[];
  limits: Limits;
  locationName: string;
  manualCoverAttachment: boolean;
  name: string;
  pos: number;
  shortLink: string;
  shortUrl: string;
  subscribed: boolean;
  url: string;
  cover: Cover;
}

export type card_data = BoardDataItem[];
