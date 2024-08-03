declare module "@spotify-internal/encore-foundation";

interface ServerManifest {
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

interface Window {
    manifest?: ServerManifest;
  }