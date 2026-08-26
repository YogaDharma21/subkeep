import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron"

const electronAPI = {
  isElectron: true,
  platform: process.platform,
  openExternal: (url: string) => ipcRenderer.invoke("shell:open-external", url),
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke("notification:show", { title, body }),
  saveFile: (options: {
    defaultFilename: string
    content: string
    mimeType?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => ipcRenderer.invoke("dialog:save-file", options),
  openFile: (options?: {
    filters?: Array<{ name: string; extensions: string[] }>
  }) => ipcRenderer.invoke("dialog:open-file", options || {}),
  startBrowserAuth: (url?: string) =>
    ipcRenderer.invoke("auth:start-browser-login", url),
  onAuthCallback: (callback: (data: { query: Record<string, string>; url: string }) => void) => {
    const handler = (_event: unknown, data: { query: Record<string, string>; url: string }) => callback(data)
    ipcRenderer.on("auth:callback", handler)
    return () => ipcRenderer.removeListener("auth:callback", handler)
  },
  minimize: () => {
    ipcRenderer.send("window:minimize")
    return ipcRenderer.invoke("window:minimize")
  },
  maximize: () => {
    ipcRenderer.send("window:maximize")
    return ipcRenderer.invoke("window:maximize")
  },
  close: () => {
    ipcRenderer.send("window:close")
    return ipcRenderer.invoke("window:close")
  },
  isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    const listener = (_event: IpcRendererEvent, isMaximized: boolean) => {
      callback(isMaximized)
    }
    ipcRenderer.on("window:maximize-change", listener)
    return () => {
      ipcRenderer.removeListener("window:maximize-change", listener)
    }
  },
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
}

contextBridge.exposeInMainWorld("electronAPI", electronAPI)
