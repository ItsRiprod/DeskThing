export interface ServerManifest {
    name: string;
    id: string;
    short_name: string;
    description: string;
    builtFor: string;
    reactive: boolean;
    author: string;
    version: string;
    port: number;
    ip: string;
  }

class ManifestStore {
  private manifest: ServerManifest = {
    "name": "Sample Client",
    "id": "deskthing",
    "short_name": "DT",
    "description": "Seeing this client means manifest.json is not configured correctly",
    "builtFor": "Spotify Car Thing",
    "reactive": true,
    "author": "Riprod",
    "version": "v0.7.0",
    "port": 8891,
    "ip": "loading-ip"
  }
  private static instance: ManifestStore
  private listeners: Set<(manifest: ServerManifest | null) => void> = new Set()

  constructor() {
    this.loadManifest()
  }

  private loadManifest(): void {
    if (window.manifest) {
      this.manifest = window.manifest as ServerManifest;
      console.log(this.manifest);
      this.notifyListeners();
    } else {
      console.error('Manifest is not loaded');
    }
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new ManifestStore()
    }
    return this.instance
  }

  getManifest(): ServerManifest | null {
    return this.manifest
  }

  addListener(listener: (manifest: ServerManifest | null) => void): void {
    this.listeners.add(listener)
  }

  removeListener(listener: (manifest: ServerManifest | null) => void): void {
    this.listeners.delete(listener)
  }

  on(listener: (manifest: ServerManifest | null) => void): () => void {
    this.addListener(listener)

    return () => {
        this.removeListener(listener)
    }
  }

  once(listener: (manifest: ServerManifest | null) => void): void {
    const onceListener = (manifest: ServerManifest | null) => {
      listener(manifest);
      this.removeListener(onceListener); // Remove the listener after it's called
    };
    this.addListener(onceListener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.manifest))
  }

  updateManifest(updatedManifest: Partial<ServerManifest>): void {
    if (this.manifest) {
      this.manifest = { ...this.manifest, ...updatedManifest }
      this.notifyListeners()
    }
  }
}

export default ManifestStore.getInstance()
