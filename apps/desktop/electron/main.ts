import { app, BrowserWindow, shell, ipcMain, dialog, Notification } from "electron"
import path from "node:path"
import fs from "node:fs"
import fsp from "node:fs/promises"
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

app.name = "subkeep"
if (process.platform === "win32") {
  app.setAppUserModelId("com.subkeep.desktop")
}

// Register custom protocol client for deep linking (subkeep://)
if (process.defaultApp || !app.isPackaged) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("subkeep", process.execPath, [
      path.resolve(process.argv[1]),
    ])
  } else {
    app.setAsDefaultProtocolClient("subkeep", process.execPath, [
      path.resolve("."),
    ])
  }
} else {
  app.setAsDefaultProtocolClient("subkeep")
}

// Function to handle deep link URLs (e.g., subkeep://auth-callback?...)
function handleDeepLink(urlString: string) {
  try {
    const raw = urlString.replace(/^subkeep:\/?\/?/, "")
    const parsed = new URL(`http://localhost/${raw}`)
    const queryParams: Record<string, string> = {}
    parsed.searchParams.forEach((val, key) => {
      queryParams[key] = val
    })

    if (win && !win.isDestroyed()) {
      win.webContents.send("auth:callback", {
        query: queryParams,
        url: urlString,
      })
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  } catch (err) {
    console.error("Failed to parse deep link:", err)
  }
}

// Ensure single instance lock for deep linking protocol handling
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

app.on("second-instance", (_event, commandLine) => {
  // Focus window when a second instance is invoked
  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }

  // Check command line arguments on Windows for deep link protocol
  const deepLink = commandLine.find((arg) => arg.startsWith("subkeep://"))
  if (deepLink) {
    handleDeepLink(deepLink)
  }
})

// Handle macOS open-url event
app.on("open-url", (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

function getAppIconPath(): string | undefined {
  const candidates = [
    path.join(__dirname, "../public/icon.png"),
    path.join(process.env.APP_ROOT || "", "public/icon.png"),
    path.join(__dirname, "../public/icon.ico"),
    path.join(process.env.APP_ROOT || "", "public/icon.ico"),
    path.join(process.cwd(), "apps/desktop/public/icon.png"),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return undefined
}

function getAppIconDataUri(): string {
  const candidates = [
    path.join(__dirname, "../public/app-icon.png"),
    path.join(process.env.APP_ROOT || "", "public/app-icon.png"),
    path.join(process.cwd(), "apps/desktop/public/app-icon.png"),
    path.join(__dirname, "../public/icon.png"),
    path.join(process.env.APP_ROOT || "", "public/icon.png"),
    path.join(process.cwd(), "apps/desktop/public/icon.png"),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const data = fs.readFileSync(candidate)
        return `data:image/png;base64,${data.toString("base64")}`
      } catch {
        // ignore
      }
    }
  }

  return ""
}

function startAuthLoopbackServer() {
  if (authServer) return

  authServer = http.createServer((req, res) => {
    // Enable CORS for web browser requests
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
      res.writeHead(200)
      res.end()
      return
    }

    if (!req.url) {
      res.writeHead(400)
      res.end("Bad Request")
      return
    }

    // Handle POST /auth-token directly from browser page
    if (req.method === "POST") {
      let body = ""
      req.on("data", (chunk) => {
        body += chunk
      })
      req.on("end", () => {
        try {
          const data = JSON.parse(body || "{}")
          if (win && !win.isDestroyed()) {
            win.webContents.send("auth:callback", {
              query: data,
              url: req.url,
            })
            if (win.isMinimized()) win.restore()
            win.show()
            win.focus()
          }
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ success: true }))
        } catch {
          res.writeHead(400)
          res.end("Invalid JSON")
        }
      })
      return
    }

    // Handle GET /auth-callback redirect from Clerk
    try {
      const parsedUrl = new URL(req.url, `http://127.0.0.1:${AUTH_PORT}`)
      const queryParams: Record<string, string> = {}
      parsedUrl.searchParams.forEach((val, key) => {
        queryParams[key] = val
      })

      const iconDataUri = getAppIconDataUri()
      const iconImg = iconDataUri
        ? `<img src="${iconDataUri}" alt="SubKeep" style="width: 100%; height: 100%; object-fit: cover;" />`
        : `<span style="font-weight: 900; font-size: 24px; color: #ffffff;">S</span>`

      // Send deep link trigger HTML to the browser tab
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SubKeep Desktop</title>
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
      border-radius: 1rem;
      border: 1px solid #27272a;
      max-width: 380px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }
    h1 { margin: 0 0 10px; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    p { margin: 0 0 24px; color: #a1a1aa; font-size: 13px; line-height: 1.5; }
    .btn {
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      padding: 14px 0;
      border-radius: 0.625rem;
      background: #ffffff;
      color: #000000;
      font-weight: 800;
      font-size: 13px;
      text-decoration: none;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      transition: opacity 0.2s ease;
    }
    .btn:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      ${iconImg}
    </div>
    <h1>Signed In Successfully</h1>
    <p>Click below if your browser did not automatically prompt you to open SubKeep.</p>
    <a id="deepLinkBtn" class="btn" href="#">Open SubKeep</a>
  </div>
  <script>
    const deepLinkUrl = "subkeep://auth-callback" + window.location.search;
    document.getElementById("deepLinkBtn").href = deepLinkUrl;
    setTimeout(() => {
      window.location.href = deepLinkUrl;
    }, 200);
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
        if (win.isMinimized()) win.restore()
        win.show()
        win.focus()
      }
    } catch {
      res.writeHead(500)
      res.end("Internal Server Error")
    }
  })

  authServer.listen(AUTH_PORT, "127.0.0.1", () => {
    console.log(`Auth loopback listening on http://127.0.0.1:${AUTH_PORT}`)
  })

  authServer.on("error", (err) => {
    console.error("Auth server error:", err)
  })
}

function getPreloadPath(): string {
  const candidates = [
    path.join(__dirname, "preload.cjs"),
    path.join(__dirname, "preload.mjs"),
    path.join(__dirname, "preload.js"),
    path.join(__dirname, "../preload/index.cjs"),
    path.join(__dirname, "../preload/index.mjs"),
    path.join(__dirname, "../preload/index.js"),
    path.join(__dirname, "../dist-electron/preload.cjs"),
    path.join(__dirname, "../dist-electron/preload.mjs"),
    path.join(app.getAppPath(), "dist-electron/preload.cjs"),
    path.join(app.getAppPath(), "dist-electron/preload.mjs"),
    path.join(process.cwd(), "dist-electron/preload.cjs"),
    path.join(process.cwd(), "dist-electron/preload.mjs"),
    path.join(process.cwd(), "apps/desktop/dist-electron/preload.cjs"),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return path.join(__dirname, "preload.cjs")
}

function createWindow() {
  const preloadPath = getPreloadPath()
  const iconPath = getAppIconPath()

  win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: "SubKeep",
    icon: iconPath,
    backgroundColor: "#09090b",
    frame: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : undefined,
    trafficLightPosition: { x: 12, y: 12 },
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Ready-to-show visual smoothing
  win.once("ready-to-show", () => {
    win?.show()
    win?.focus()
  })

  // Maximize / Unmaximize event broadcasting to renderer
  win.on("maximize", () => {
    win?.webContents.send("window:maximize-change", true)
  })

  win.on("unmaximize", () => {
    win?.webContents.send("window:maximize-change", false)
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

  win.on("closed", () => {
    win = null
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"))
  }
}

function getTargetWindow(event?: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent): BrowserWindow | null {
  if (event) {
    const fromSender = BrowserWindow.fromWebContents(event.sender)
    if (fromSender && !fromSender.isDestroyed()) return fromSender
  }
  if (win && !win.isDestroyed()) return win
  const focused = BrowserWindow.getFocusedWindow()
  if (focused && !focused.isDestroyed()) return focused
  const all = BrowserWindow.getAllWindows()
  if (all.length > 0 && !all[0].isDestroyed()) return all[0]
  return null
}

// Window state IPC handlers
ipcMain.handle("window:minimize", (event) => {
  const targetWin = getTargetWindow(event)
  if (targetWin && !targetWin.isDestroyed()) {
    targetWin.minimize()
    return true
  }
  return false
})

ipcMain.handle("window:maximize", (event) => {
  const targetWin = getTargetWindow(event)
  if (!targetWin || targetWin.isDestroyed()) return false
  if (targetWin.isMaximized()) {
    targetWin.unmaximize()
    return false
  } else {
    targetWin.maximize()
    return true
  }
})

ipcMain.handle("window:close", (event) => {
  const targetWin = getTargetWindow(event)
  if (targetWin && !targetWin.isDestroyed()) {
    targetWin.close()
    return true
  }
  return false
})

ipcMain.handle("window:is-maximized", (event) => {
  const targetWin = getTargetWindow(event)
  return targetWin && !targetWin.isDestroyed() ? targetWin.isMaximized() : false
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
  const targetWin = getTargetWindow()
  if (!targetWin) return { success: false, error: "No window active" }

  const result = await dialog.showSaveDialog(targetWin, {
    defaultPath: defaultFilename,
    filters: filters || [
      { name: "All Files", extensions: ["*"] }
    ],
  })

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true }
  }

  try {
    await fsp.writeFile(result.filePath, content, "utf-8")
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
  const targetWin = getTargetWindow()
  if (!targetWin) return { success: false, error: "No window active" }

  const result = await dialog.showOpenDialog(targetWin, {
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
    const content = await fsp.readFile(selectedPath, "utf-8")
    const filename = path.basename(selectedPath)
    return { success: true, filename, content }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
})

// Browser Auth Loopback Server IPC
ipcMain.handle("auth:start-browser-login", async (_event, customUrl?: string) => {
  const callbackUrl = "http://localhost:5173/auth/desktop-callback"
  startAuthLoopbackServer()

  const targetUrl = customUrl || `${CLERK_HOSTED_DOMAIN}/sign-in?redirect_url=${encodeURIComponent(callbackUrl)}`
  await shell.openExternal(targetUrl)

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

app.whenReady().then(() => {
  startAuthLoopbackServer()
  createWindow()
})
