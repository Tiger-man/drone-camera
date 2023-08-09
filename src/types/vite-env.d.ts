/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SERVER_PATH: string
  readonly VITE_BASE_URL: string
}

// eslint-disable-next-line no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv
}
