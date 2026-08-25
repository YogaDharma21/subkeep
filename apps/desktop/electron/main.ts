import { app, BrowserWindow, shell, ipcMain, dialog, Notification } from "electron"
import path from "node:path"
import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, "..")

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron")
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist")

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST

let win: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: "SubKeep",
    backgroundColor: "#09090b",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Open all target="_blank" or external window links in user default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url)
    }
    return { action: "deny" }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"))
  }
}

// Window state IPC handlers
ipcMain.handle("window:minimize", () => {
  win?.minimize()
})

ipcMain.handle("window:maximize", () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.handle("window:close", () => {
  win?.close()
})

ipcMain.handle("window:is-maximized", () => {
  return win?.isMaximized() ?? false
})

// External link opener
ipcMain.handle("shell:open-external", async (_event, url: string) => {
  if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:"))) {
    await shell.openExternal(url)
    return true
  }
  return false
})

// Native Desktop Notifications
ipcMain.handle("notification:show", (_event, { title, body }: { title: string; body: string }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || "SubKeep",
      body: body || "",
    }).show()
    return true
  }
  return false
})

// Native File Save Dialog (Export CSV/JSON)
ipcMain.handle("dialog:save-file", async (_event, { defaultFilename, content, filters }: {
  defaultFilename: string
  content: string
  mimeType?: string
  filters?: Array<{ name: string; extensions: string[] }>
}) => {
  if (!win) return { success: false, error: "No window active" }

  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultFilename,
    filters: filters || [
      { name: "All Files", extensions: ["*"] }
    ],
  })

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true }
  }

  try {
    await fs.writeFile(result.filePath, content, "utf-8")
    return { success: true, filePath: result.filePath }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
})

// Native File Open Dialog (Import CSV/JSON)
ipcMain.handle("dialog:open-file", async (_event, { filters }: {
  filters?: Array<{ name: string; extensions: string[] }>
}) => {
  if (!win) return { success: false, error: "No window active" }

  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile"],
    filters: filters || [
      { name: "Backup Files", extensions: ["json", "csv"] },
      { name: "All Files", extensions: ["*"] },
    ],
  })

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { success: false, canceled: true }
  }

  const selectedPath = result.filePaths[0]
  try {
    const content = await fs.readFile(selectedPath, "utf-8")
    const filename = path.basename(selectedPath)
    return { success: true, filename, content }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
})

// App info
ipcMain.handle("app:get-info", () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    isPackaged: app.isPackaged,
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
    win = null
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
