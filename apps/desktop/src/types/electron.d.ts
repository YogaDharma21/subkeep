export interface ElectronAPI {
  isElectron: boolean
  platform: NodeJS.Platform | string
  openExternal: (url: string) => Promise<boolean>
  showNotification: (title: string, body: string) => Promise<boolean>
  saveFile: (options: {
    defaultFilename: string
    content: string
    mimeType?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>
  openFile: (options?: {
    filters?: Array<{ name: string; extensions: string[] }>
  }) => Promise<{ success: boolean; filename?: string; content?: string; error?: string; canceled?: boolean }>
  startBrowserAuth: (url?: string) => Promise<{ success: boolean }>
  onAuthCallback: (
    callback: (data: { query: Record<string, string>; url: string }) => void
  ) => () => void
  minimize: () => Promise<void>
  maximize: () => Promise<boolean>
  close: () => Promise<void>
  isMaximized: () => Promise<boolean>
  onMaximizeChange?: (callback: (isMaximized: boolean) => void) => () => void
  getAppInfo: () => Promise<{ version: string; platform: string; isPackaged: boolean }>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
