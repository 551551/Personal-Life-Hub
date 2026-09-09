const { app, BrowserWindow, dialog, Menu, protocol, session } = require('electron')
const { readFile } = require('node:fs/promises')
const path = require('node:path')
const { origin, resolveAsset } = require('./assets.cjs')

app.setName('PersonalLifeHub')
app.setPath('userData', app.commandLine.getSwitchValue('user-data-dir') || path.join(app.getPath('appData'), 'PersonalLifeHub'))
app.setAppUserModelId('local.personal-life-hub.desktop')
protocol.registerSchemesAsPrivileged([
  { scheme: 'lifehub', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
])

let mainWindow
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })
  app.whenReady().then(async () => {
    const root = path.join(app.getAppPath(), 'dist')
    protocol.handle('lifehub', async (request) => {
      try {
        const asset = resolveAsset(request.url, root)
        if (!asset || request.method !== 'GET') return new Response('Forbidden', { status: 403 })
        return new Response(await readFile(asset.file), { headers: { 'Content-Type': asset.mime, 'X-Content-Type-Options': 'nosniff' } })
      } catch {
        return new Response('Not found', { status: 404 })
      }
    })
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
    session.defaultSession.setPermissionCheckHandler(() => false)
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      const url = new URL(details.url)
      const allowed = (url.protocol === 'lifehub:' && url.host === 'app') ||
        (url.protocol === 'blob:' && details.url.startsWith(`blob:${origin}/`)) || url.protocol === 'data:'
      callback({ cancel: !allowed })
    })
    Menu.setApplicationMenu(null)
    mainWindow = new BrowserWindow({
      title: '个人工作生活中心', width: 1440, height: 960, minWidth: 1000, minHeight: 700,
      backgroundColor: '#f3f6f8', show: false,
      icon: path.join(__dirname, 'icon.ico'),
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true },
    })
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith(`${origin}/`)) event.preventDefault()
    })
    mainWindow.once('ready-to-show', () => mainWindow.show())
    mainWindow.on('closed', () => { mainWindow = null })
    await mainWindow.loadURL(`${origin}/index.html`)
  }).catch((error) => {
    dialog.showErrorBox('应用启动失败', `请保留数据并重新安装应用。\n${error.message}`)
    app.quit()
  })
  app.on('window-all-closed', () => app.quit())
}
