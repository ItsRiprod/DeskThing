import Socket from '../Socket';
import { makeAutoObservable, runInAction } from 'mobx';
import SeedableStorageInterface from './SeedableStorageInterface';

export const LOCAL_STORAGE_KEY = 'local-storage-data';

type PutStorage = {
  type: 'settings';
  action: 'put';
  value_type: 'string';
  key: string;
  value: string;
};

type GetStorageReply = {
  type: 'settings_response';
  payload: GetStoragePayload;
};

type GetStoragePayload = {
  key: string;
  value?: string;
  value_type: 'string';
  error?: boolean;
};

class MiddlewareStorage implements SeedableStorageInterface {
  socket: Socket;

  key_to_value_memcache?: Partial<Record<string, string>>;

  constructor(socket: Socket) {
    this.socket = socket;
    this.key_to_value_memcache = undefined;

    makeAutoObservable(this, { socket: false });

    this.seed();
  }

  handleGetStorageReply(msg: GetStorageReply) {
    if (
      !this.seeded &&
      msg.type === 'settings_response' &&
      msg.payload.key === LOCAL_STORAGE_KEY
    ) {
      let received_value = '{}';
      if (msg.payload.value) {
        received_value = msg.payload.value;
      }
      this.markAsSeeded();
      const seedValues = JSON.parse(received_value);
      for (const key in seedValues) {
        if (Object.prototype.hasOwnProperty.call(seedValues, key)) {
          this.key_to_value_memcache![key] = seedValues[key];
        }
      }
    }
  }

  markAsSeeded(): void {
    runInAction(() => {
      this.key_to_value_memcache = {};
    });
  }

  private seed() {
    this.socket.addSocketEventListener((msg: GetStorageReply) => {
      this.handleGetStorageReply(msg);
    });

    this.socket.post({
      type: 'settings',
      action: 'get',
      value_type: 'string',
      key: LOCAL_STORAGE_KEY,
    });
  }

  get seeded(): boolean {
    return this.key_to_value_memcache !== undefined;
  }

  setItem(key: string, value: string): void {
    if (this.seeded) {
      if (this.key_to_value_memcache![key] !== value) {
        runInAction(() => {
          this.key_to_value_memcache![key] = value;
          this.postCache();
        });
      }
    }
  }

  private postCache() {
    this.socket.post({
      type: 'settings',
      action: 'put',
      value_type: 'string',
      key: LOCAL_STORAGE_KEY,
      value: JSON.stringify(this.key_to_value_memcache),
    } as PutStorage);
  }

  getItem(key: string): string | null {
    if (this.key_to_value_memcache === undefined) {
      return null;
    }
    return this.key_to_value_memcache[key] ?? null;
  }

  clear(): void {
    if (this.seeded) {
      this.key_to_value_memcache = {};
      this.postCache();
    }
  }
}

export default MiddlewareStorage;
