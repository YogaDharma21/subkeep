import { app, BrowserWindow, shell, ipcMain, dialog, Notification } from "electron"
import path from "node:path"
import fs from "node:fs/promises"
import http from "node:http"
import { fileURLToPath, URL } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, "..")

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron")
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist")

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST

let win: BrowserWindow | null = null
let authServer: http.Server | null = null

const AUTH_PORT = 49221
const CLERK_HOSTED_DOMAIN = "https://engaging-mole-10.clerk.accounts.dev"

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: "SubKeep",
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Prevent in-app navigation to external websites: open in default external browser
  win.webContents.on("will-navigate", (event, navigationUrl) => {
    const isLocal =
      navigationUrl.startsWith("http://localhost:") ||
      navigationUrl.startsWith("http://127.0.0.1:") ||
      navigationUrl.startsWith("file://")

    if (!isLocal) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })

  // Intercept all new window requests: open in default external browser
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

// Browser Auth Loopback Server IPC
ipcMain.handle("auth:start-browser-login", async (_event, customUrl?: string) => {
  const callbackUrl = `http://127.0.0.1:${AUTH_PORT}/auth-callback`

  // Close previous server if running
  if (authServer) {
    try {
      authServer.close()
    } catch {
      // Ignore
    }
    authServer = null
  }

  // Create temporary local HTTP loopback server to receive the OAuth callback
  authServer = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400)
      res.end("Bad Request")
      return
    }

    try {
      const parsedUrl = new URL(req.url, `http://127.0.0.1:${AUTH_PORT}`)
      const queryParams: Record<string, string> = {}
      parsedUrl.searchParams.forEach((val, key) => {
        queryParams[key] = val
      })

      // Send sleek dark response HTML to the browser tab
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SubKeep Desktop - Authenticated</title>
  <style>
    body {
      margin: 0;
      background-color: #000000;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      box-sizing: border-box;
    }
    .container {
      text-align: center;
      background: #111113;
      padding: 44px 36px;
      border-radius: 24px;
      border: 1px solid #27272a;
      max-width: 380px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
    }
    .icon {
      width: 60px;
      height: 60px;
      background: #ffffff;
      border-radius: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    h1 { margin: 0 0 10px; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    p { margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#000000">
        <path d="M12 2.2L20.8 7.3L12 12.4L3.2 7.3L12 2.2Z" />
        <path d="M2.5 9.1L11.3 14.2V21.8L2.5 16.7V9.1Z" />
        <path d="M12.7 14.2L21.5 9.1V16.7L12.7 21.8V14.2Z" />
      </svg>
    </div>
    <h1>Signed In Successfully</h1>
    <p>You are now connected to <strong>SubKeep Desktop</strong>. You can close this tab and return to the desktop application.</p>
  </div>
  <script>
    setTimeout(() => {
      window.close();
    }, 1500);
  </script>
</body>
</html>`

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      res.end(html)

      // Forward token/ticket to renderer
      if (win && !win.isDestroyed()) {
        win.webContents.send("auth:callback", {
          query: queryParams,
          url: req.url,
        })
        win.show()
        win.focus()
      }

      // Close the loopback server after callback handling
      setTimeout(() => {
        if (authServer) {
          authServer.close()
          authServer = null
        }
      }, 3000)
    } catch {
      res.writeHead(500)
      res.end("Internal Server Error")
    }
  })

  authServer.listen(AUTH_PORT, "127.0.0.1", async () => {
    // Open Clerk Sign-In with redirect back to our local loopback server
    const targetUrl = customUrl || `${CLERK_HOSTED_DOMAIN}/sign-in?redirect_url=${encodeURIComponent(callbackUrl)}`
    await shell.openExternal(targetUrl)
  })

  authServer.on("error", (err) => {
    console.error("Auth server error:", err)
    if (authServer) {
      authServer.close()
      authServer = null
    }
  })

  return { success: true }
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
  if (authServer) {
    authServer.close()
    authServer = null
  }
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
