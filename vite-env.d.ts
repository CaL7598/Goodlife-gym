/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_RESEND_API_KEY?: string
  readonly VITE_RESEND_FROM_EMAIL?: string
  readonly VITE_API_URL?: string
  readonly GEMINI_API_KEY?: string
  readonly RESEND_API_KEY?: string
  readonly RESEND_FROM_EMAIL?: string
  readonly NODE_ENV: string
  readonly VITE_BASE_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  glob: (pattern: string) => Record<string, () => Promise<any>>
}

declare module '*.mp4' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

