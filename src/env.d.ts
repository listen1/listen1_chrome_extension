/// <reference types="vite/client" />
/// <reference types="../node_modules/vue/ref-macros" />

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module 'global' {
  import type { Session, IpcRenderer, Cookie, CookiesGetFilter } from 'electron';
  global {
    type Theme = 'black' | 'white';
    interface Window {
      api: {
        setZoomLevel: (level: number) => void;
        setTheme: (theme: Theme) => void;
        getCookie: (request: CookiesGetFilter) => Promise<Cookie[]>;
        setCookie: (cookie: Cookie) => Promise<void>;
        removeCookie: (url: string, name: string) => void;
        session: Session;
        ipcRenderer: IpcRenderer;
        platform: NodeJS.Platform;
        sendControl: any;
        onLyricWindow: any;
        ipcOn: any;
        ipcOnce: any;
      };
    }
  }
}
