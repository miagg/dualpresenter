import { app, shell, BrowserWindow, ipcMain, screen, dialog, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import config from './config'
import { parseExcel } from './utils'
import { Data } from './interfaces/Data'
import fileWatcher from 'chokidar'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null
let mainDisplayWindow: BrowserWindow | null = null
let sideDisplayWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let watcher: fileWatcher.FSWatcher | null = null
let lastModifiedTime: Date | null = null
let fileCheckInterval: NodeJS.Timeout | null = null
let debounceTimer: NodeJS.Timeout | null = null

const data: Data = {
  cards: [],
  names: [],
  config: config.get('config'),
  state: config.get('state')
}

// Initialize state if needed
if (data.state.currentSlideIndex === undefined) data.state.currentSlideIndex = 0
if (data.config.slideOffset === undefined) data.config.slideOffset = 0
if (data.state.freezeMonitors === undefined) data.state.freezeMonitors = false

// Debounce function to prevent multiple rapid reloads
function debounce(func: Function, delay: number): () => void {
  return function () {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      func()
      debounceTimer = null
    }, delay)
  }
}

// Function to check file stats directly
function checkFileStats(): void {
  if (!data.state.excelPath) return

  try {
    const stats = fs.statSync(data.state.excelPath)
    if (lastModifiedTime && stats.mtime > lastModifiedTime) {
      lastModifiedTime = stats.mtime
      // Use debounced function to reload data
      debouncedLoadData()
    } else if (!lastModifiedTime) {
      lastModifiedTime = stats.mtime
    }
  } catch (error) {
    console.error('Error checking file stats:', error)
  }
}

// Create a debounced version of loadData
const debouncedLoadData = debounce(loadData, 500)

// Function to handle file watcher events
function handleFileChange(): void {
  debouncedLoadData()
}

function updateMonitorList(): void {
  // Get all displays and mark the primary display
  data.monitors = screen.getAllDisplays().map((monitor) => ({
    ...monitor,
    isPrimary: screen.getPrimaryDisplay().id === monitor.id
  }))

  // Auto-assign monitors if not already assigned
  if (!data.state.mainScreen && data.monitors.length > 1) {
    // Find a non-primary display for the main screen
    const nonPrimaryDisplay = data.monitors.find((m) => !m.isPrimary)
    if (nonPrimaryDisplay) {
      data.state.mainScreen = nonPrimaryDisplay.id.toString()

      // Set another non-primary display as side screen if available
      if (data.monitors.length > 2) {
        const sideMonitor = data.monitors.find(
          (m) => !m.isPrimary && m.id.toString() !== data.state.mainScreen
        )
        data.state.sideScreen = sideMonitor?.id.toString() || null
      }

      // Save to config
      config.set('state.mainScreen', data.state.mainScreen)
      config.set('state.sideScreen', data.state.sideScreen)
    }
  }

  sendData()
}

function loadData(): void {
  while (!data.state.excelPath) {
    // Show dialog to select excel file or exit application
    const response = dialog.showMessageBoxSync({
      type: 'info',
      title: 'Open Project',
      message: 'Please select an excel file or exit the application',
      buttons: ['Select excel file', 'Exit'],
      defaultId: 0,
      cancelId: 1
    })
    if (response === 1) {
      app.quit()
      return
    }
    // Show open file dialog to select excel file
    data.state.excelPath = dialog.showOpenDialogSync({
      title: 'Select Excel File',
      properties: ['openFile'],
      filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx'] }]
    })?.[0]
    if (data.state.excelPath) {
      config.set('state.excelPath', data.state.excelPath)
    }
  }

  // Setup file watcher if needed
  if (watcher) {
    watcher.close()
  }

  // Configure more robust file watching for Excel files
  watcher = fileWatcher.watch(data.state.excelPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 5000, // Wait for 1 second of inactivity before considering file written
      pollInterval: 100 // Poll every 100ms
    },
    // Need to set this higher for Excel which can take time to complete its save process
    usePolling: true,
    interval: 400
  })

  // Listen to multiple events that might indicate the file has changed
  watcher
    .on('change', handleFileChange)
    .on('add', handleFileChange)
    .on('unlink', () => {
      // The file might be temporarily removed during Excel's save process
      setTimeout(checkFileStats, 500)
    })

  // Initialize the lastModifiedTime
  if (fs.existsSync(data.state.excelPath)) {
    lastModifiedTime = fs.statSync(data.state.excelPath).mtime
  }

  // Parse the Excel file
  const parsedData = parseExcel(data.state.excelPath)
  data.cards = parsedData.cards
  data.names = parsedData.names

  // Handle empty or invalid excel file
  if (data.cards.length === 0) {
    data.state.excelPath = ''
    config.set('state.excelPath', '')
    loadData()
    return
  }

  // Make sure currentSlideIndex is within bounds
  if (data.state.currentSlideIndex >= data.cards.length) {
    data.state.currentSlideIndex = 0
    config.set('state.currentSlideIndex', 0)
  }

  sendData()
  updateDisplayWindows()
}

function sendData(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.webContents.isLoading()) {
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('data-updated', data)
      })
    } else {
      mainWindow.webContents.send('data-updated', data)
    }
  }
}

function updateDisplayWindows(): void {
  if (data.state.freezeMonitors) {
    return
  }

  // First, close any windows that should not be open based on current configuration

  // Close main display window if needed
  if (!data.state.mainScreen || data.cards.length === 0) {
    if (mainDisplayWindow && !mainDisplayWindow.isDestroyed()) {
      mainDisplayWindow.close()
      mainDisplayWindow = null
    }
  }

  // Close side display window if needed
  if (!data.state.sideScreen || data.cards.length === 0) {
    if (sideDisplayWindow && !sideDisplayWindow.isDestroyed()) {
      sideDisplayWindow.close()
      sideDisplayWindow = null
    }
  }

  // Then update windows that should be open
  if (data.state.mainScreen) {
    updateMainDisplayWindow()
  }

  if (data.state.sideScreen) {
    updateSideDisplayWindow()
  }
}

function updateMainDisplayWindow(): void {
  if (!data.state.mainScreen || data.cards.length === 0) {
    // Close window if it exists
    if (mainDisplayWindow && !mainDisplayWindow.isDestroyed()) {
      mainDisplayWindow.close()
      mainDisplayWindow = null
    }
    return
  }

  const targetMonitor = data.monitors?.find((m) => m.id.toString() === data.state.mainScreen)
  if (!targetMonitor) return

  // Create or update main display window
  const url =
    is.dev && process.env['ELECTRON_RENDERER_URL']
      ? `${process.env['ELECTRON_RENDERER_URL']}/#/display`
      : `file://${join(__dirname, '../renderer/index.html')}#/display`

  if (!mainDisplayWindow || mainDisplayWindow.isDestroyed()) {
    // Create new window for main display
    mainDisplayWindow = new BrowserWindow({
      x: targetMonitor.bounds.x,
      y: targetMonitor.bounds.y,
      width: targetMonitor.bounds.width,
      height: targetMonitor.bounds.height,
      frame: false,
      fullscreen: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false
      }
    })

    mainDisplayWindow.loadURL(url)

    mainDisplayWindow.webContents.on('did-finish-load', () => {
      if (mainDisplayWindow) {
        mainDisplayWindow.webContents.send('display-data', {
          type: 'main',
          currentSlideIndex: data.state.currentSlideIndex,
          cards: data.cards,
          names: data.names,
          config: data.config
        })
      }
    })
  } else {
    // Reposition if needed
    mainDisplayWindow.setBounds(targetMonitor.bounds)

    // Update content
    mainDisplayWindow.webContents.send('display-data', {
      type: 'main',
      currentSlideIndex: data.state.currentSlideIndex,
      cards: data.cards,
      names: data.names,
      config: data.config
    })
  }
}

function updateSideDisplayWindow(): void {
  if (!data.state.sideScreen || data.cards.length === 0) {
    // Close window if it exists
    if (sideDisplayWindow && !sideDisplayWindow.isDestroyed()) {
      sideDisplayWindow.close()
      sideDisplayWindow = null
    }
    return
  }

  const targetMonitor = data.monitors?.find((m) => m.id.toString() === data.state.sideScreen)
  if (!targetMonitor) return

  // Create or update side display window
  const url =
    is.dev && process.env['ELECTRON_RENDERER_URL']
      ? `${process.env['ELECTRON_RENDERER_URL']}/#/display`
      : `file://${join(__dirname, '../renderer/index.html')}#/display`

  if (!sideDisplayWindow || sideDisplayWindow.isDestroyed()) {
    sideDisplayWindow = new BrowserWindow({
      x: targetMonitor.bounds.x,
      y: targetMonitor.bounds.y,
      width: targetMonitor.bounds.width,
      height: targetMonitor.bounds.height,
      frame: false,
      fullscreen: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false
      }
    })

    sideDisplayWindow.loadURL(url)

    sideDisplayWindow.webContents.on('did-finish-load', () => {
      if (sideDisplayWindow) {
        // Calculate offset slide index, handling both positive and negative offsets
        const offsetIndex = calculateOffsetIndex(
          data.state.currentSlideIndex,
          data.config.slideOffset,
          data.cards.length
        )

        sideDisplayWindow.webContents.send('display-data', {
          type: 'side',
          currentSlideIndex: offsetIndex,
          cards: data.cards,
          names: data.names,
          config: data.config
        })
      }
    })
  } else {
    // Reposition if needed
    sideDisplayWindow.setBounds(targetMonitor.bounds)

    // Calculate offset slide index, handling both positive and negative offsets
    const offsetIndex = calculateOffsetIndex(
      data.state.currentSlideIndex,
      data.config.slideOffset,
      data.cards.length
    )

    sideDisplayWindow.webContents.send('display-data', {
      type: 'side',
      currentSlideIndex: offsetIndex,
      cards: data.cards,
      names: data.names,
      config: data.config
    })
  }
}

// Helper function to calculate offset index with boundary checking
function calculateOffsetIndex(currentIndex: number, offset: number, totalSlides: number): number {
  // For positive offset (side screen shows slides behind main screen)
  if (offset > 0) {
    return Math.max(0, currentIndex - offset)
  }
  // For negative offset (side screen shows slides ahead of main screen)
  else if (offset < 0) {
    return Math.min(totalSlides - 1, currentIndex - offset)
  }
  // For zero offset (side screen shows same slide as main screen)
  else {
    return currentIndex
  }
}

function createSettingsWindow(): void {
  // Close the existing window if it's open
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return
  }

  // Create a new settings window
  settingsWindow = new BrowserWindow({
    width: 800,
    height: 700,
    title: 'Settings',
    parent: mainWindow || undefined,
    modal: true, // Make it a modal window to keep it pinned to the parent
    movable: true, // Allow it to be moved but still attached to the parent
    frame: true,
    resizable: true,
    fullscreenable: false,
    minimizable: false, // Disable minimize button since it's pinned
    maximizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  // Remove the window menu
  settingsWindow.setMenu(null)

  // Load the settings URL
  const settingsUrl =
    is.dev && process.env['ELECTRON_RENDERER_URL']
      ? `${process.env['ELECTRON_RENDERER_URL']}/#/settings`
      : `file://${join(__dirname, '../renderer/index.html')}#/settings`

  settingsWindow.loadURL(settingsUrl)

  // When settings window is ready, send current configuration
  settingsWindow.webContents.on('did-finish-load', () => {
    if (settingsWindow) {
      settingsWindow.webContents.send('settings-data', data.config)
    }
  })

  // Handle window close
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

// Register global shortcuts for slide navigation
function registerGlobalShortcuts(): void {
  // Unregister any existing shortcuts first to avoid duplicates
  globalShortcut.unregisterAll()

  // Register keyboard shortcuts that work on both macOS and Windows
  // For previous slide: Control+Shift+Left
  globalShortcut.register('CommandOrControl+Shift+Left', () => {
    if (data.state.currentSlideIndex > 0) {
      data.state.currentSlideIndex--
      config.set('state.currentSlideIndex', data.state.currentSlideIndex)
      sendData()
      updateDisplayWindows()
    }
  })

  // For next slide: Control+Shift+Right
  globalShortcut.register('CommandOrControl+Shift+Right', () => {
    if (data.state.currentSlideIndex < data.cards.length - 1) {
      data.state.currentSlideIndex++
      config.set('state.currentSlideIndex', data.state.currentSlideIndex)
      sendData()
      updateDisplayWindows()
    }
  })

  // For refreshing data: Control+Shift+R
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    loadData()
  })

  // For freezing/unfreezing displays: Control+Shift+F
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    data.state.freezeMonitors = !data.state.freezeMonitors
    config.set('state.freezeMonitors', data.state.freezeMonitors)
    sendData()

    if (!data.state.freezeMonitors) {
      updateDisplayWindows()
    }
  })

  // For opening settings - Platform specific shortcuts
  if (process.platform === 'darwin') {
    // For macOS: Cmd+.
    globalShortcut.register('Command+.', () => {
      createSettingsWindow()
    })
  } else {
    // For Windows/Linux: Ctrl+P
    globalShortcut.register('Control+P', () => {
      createSettingsWindow()
    })
  }
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 1024,
    minHeight: 768,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Get monitors
  updateMonitorList()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.miagg')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Handle IPC events
  ipcMain.on('get-data', loadData)

  ipcMain.on('next-slide', () => {
    if (data.state.currentSlideIndex < data.cards.length - 1) {
      data.state.currentSlideIndex++
      config.set('state.currentSlideIndex', data.state.currentSlideIndex)
      sendData()
      updateDisplayWindows()
    }
  })

  ipcMain.on('prev-slide', () => {
    if (data.state.currentSlideIndex > 0) {
      data.state.currentSlideIndex--
      config.set('state.currentSlideIndex', data.state.currentSlideIndex)
      sendData()
      updateDisplayWindows()
    }
  })

  ipcMain.on('goto-slide', (_, index: number) => {
    if (index >= 0 && index < data.cards.length) {
      data.state.currentSlideIndex = index
      config.set('state.currentSlideIndex', data.state.currentSlideIndex)
      sendData()
      updateDisplayWindows()
    }
  })

  ipcMain.on('set-main-screen', (_, monitorId: string) => {
    data.state.mainScreen = monitorId
    config.set('state.mainScreen', monitorId)
    sendData()
    updateDisplayWindows()
  })

  ipcMain.on('set-side-screen', (_, monitorId: string | null) => {
    // Clear previous side display window if it exists
    if (sideDisplayWindow && !sideDisplayWindow.isDestroyed()) {
      sideDisplayWindow.close()
      sideDisplayWindow = null
    }

    // Update state with new side screen selection
    data.state.sideScreen = monitorId
    config.set('state.sideScreen', monitorId)

    // Send updated data to renderer
    sendData()

    // Update display windows
    updateDisplayWindows()
  })

  ipcMain.on('toggle-freeze', () => {
    data.state.freezeMonitors = !data.state.freezeMonitors
    config.set('state.freezeMonitors', data.state.freezeMonitors)
    sendData()

    if (!data.state.freezeMonitors) {
      updateDisplayWindows()
    }
  })

  ipcMain.on('open-excel', () => {
    const filePath = dialog.showOpenDialogSync({
      title: 'Select Excel File',
      properties: ['openFile'],
      filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx'] }]
    })?.[0]

    if (filePath) {
      data.state.excelPath = filePath
      config.set('state.excelPath', filePath)
      loadData()
    }
  })

  ipcMain.on('refresh-data', loadData)

  ipcMain.on('update-config', (_, newConfig) => {
    data.config = newConfig
    config.set('config', newConfig)
    sendData()
    updateDisplayWindows()

    // Update settings window if it's open
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('settings-data', data.config)
    }
  })

  // Add the file selection handler for settings
  ipcMain.handle('select-file', async (_, options) => {
    return dialog.showOpenDialog(options)
  })

  // Add handler for opening settings window
  ipcMain.on('open-settings', () => {
    createSettingsWindow()
  })

  // Add handler for settings window requesting data
  ipcMain.on('get-settings-data', (event) => {
    // Check if the request is coming from the settings window
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win === settingsWindow) {
      event.sender.send('settings-data', data.config)
    }
  })

  // Add handler for closing settings window
  ipcMain.on('close-settings', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close()
      settingsWindow = null
    }
  })

  // Add handler for loading image files as data URLs
  ipcMain.handle('get-image-data', async (_, filePath) => {
    try {
      if (!filePath || typeof filePath !== 'string') {
        return null
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File does not exist: ${filePath}`)
        return null
      }

      // Read the file
      const data = fs.readFileSync(filePath)

      // Determine mime type based on extension
      let mimeType = 'image/png' // Default
      if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (filePath.toLowerCase().endsWith('.gif')) {
        mimeType = 'image/gif'
      }

      // Convert to data URL
      const dataUrl = `data:${mimeType};base64,${data.toString('base64')}`
      return dataUrl
    } catch (error) {
      console.error('Error loading image:', error)
      return null
    }
  })

  // Register global shortcuts when app is ready
  registerGlobalShortcuts()

  createWindow()
  loadData()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Watch for display changes
  screen.on('display-added', updateMonitorList)
  screen.on('display-removed', updateMonitorList)
  screen.on('display-metrics-changed', updateMonitorList)

  // Start interval to check file stats
  fileCheckInterval = setInterval(checkFileStats, 1000)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  app.quit()
})

// Clean up resources when quitting
app.on('will-quit', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll()

  if (watcher) {
    watcher.close()
  }
  if (fileCheckInterval) {
    clearInterval(fileCheckInterval)
  }
})
