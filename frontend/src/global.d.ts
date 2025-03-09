declare interface Process {
  env: Record<string, string | undefined>;
  argv: string[];
  versions: {
    http_parser: string;
    node: string;
    v8: string;
    ares: string;
    uv: string;
    zlib: string;
    modules: string;
    openssl: string;
  };
  platform: 'browser';
}

declare let process: Process;

declare module 'buffer' {
  export const Buffer: any;
}

// For react-yjs
declare module 'react-yjs' {
  import * as Y from 'yjs';
  
  export interface UseYjsOptions {
    room: string;
    connect: (doc: Y.Doc) => any;
    options?: any;
  }

  export function useYjs(options: UseYjsOptions): {
    doc: Y.Doc;
    provider: any;
    connected: boolean;
  };
}

// For y-webrtc
declare module 'y-webrtc' {
  import * as Y from 'yjs';
  
  export class WebrtcProvider {
    constructor(room: string, doc: Y.Doc, options?: any);
    disconnect(): void;
    connect(): void;
  }
} 