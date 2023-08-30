/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SERVER_PATH: string
  readonly VITE_BASE_URL: string
}

// eslint-disable-next-line no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'hls.js' {
  const Hls: any;
  export default Hls;
}

declare module 'dplayer' {
  const Dplayer: any;
  export default Dplayer;
}
