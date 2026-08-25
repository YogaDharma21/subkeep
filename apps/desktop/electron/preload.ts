import { contextBridge, ipcRenderer } from "electron"

const electronAPI = {
  isElectron: true,
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
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
}

contextBridge.exposeInMainWorld("electronAPI", electronAPI)
