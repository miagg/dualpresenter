import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  screen,
  dialog,
  globalShortcut,
  Menu,
  nativeTheme
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import config from './config'
import { parseExcel } from './utils'
import { Data } from './interfaces/Data'
import fileWatcher from 'chokidar'
import fs from 'fs'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let mainDisplayWindow: BrowserWindow | null = null
let sideDisplayWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let watcher: fileWatcher.FSWatcher | null = null
let lastModifiedTime: Date | null = null
let fileCheckInterval: NodeJS.Timeout | null = null
let debounceTimer: NodeJS.Timeout | null = null

// Directory for slide previews
const previewsDir = path.join(app.getPath('userData'), 'slide-previews')

// Create previews directory if it doesn't exist
if (!fs.existsSync(previewsDir)) {
  fs.mkdirSync(previewsDir, { recursive: true })
}

const data: Data = {
  cards: [],
  names: [],
  config: config.get('config'),
  state: config.get('state')
}

// Initialize state if needed
if (data.state.currentSlideIndex === undefined) data.state.currentSlideIndex = 0
if (data.config.namesPrecedence === undefined) data.config.namesPrecedence = 0
if (data.state.freezeMonitors === undefined) data.state.freezeMonitors = false
if (data.state.blackOutScreens === undefined) data.state.blackOutScreens = false
if (data.state.frozenSlideIndex === undefined) data.state.frozenSlideIndex = null

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

  // No auto-assignment of monitors anymore
  // Just send the updated monitor list to the renderer
  sendData()
}

function loadData(): void {
  if (!data.state.excelPath) {
    // If no file path is set, clear the watcher and return
    if (watcher) {
      watcher.close()
      watcher = null
    }
    return
  }
  if (watcher) {
    watcher.close()
  }

  // If file does not exist, reset the state
  if (!fs.existsSync(data.state.excelPath)) {
    data.state.excelPath = ''
    data.state.currentSlideIndex = 0
    config.set('state.excelPath', '')
    config.set('state.currentSlideIndex', 0)
    sendData()
    return
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

  // Make sure currentSlideIndex is within bounds
  if (data.state.currentSlideIndex >= data.cards.length) {
    data.state.currentSlideIndex = 0
    config.set('state.currentSlideIndex', 0)
  }

  // After loading data, notify renderer to regenerate all slide previews
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('regenerate-previews')
  }

  sendData()
  updateDisplayWindows()
}

// Function to close the currently open Excel file
function closeExcelFile(): void {
  // Confirm closing when main display is active
  if (data.state.mainScreen) {
    const response = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Cancel', 'Close'],
      title: 'Confirm Close',
      message:
        'Are you sure you want to close the currently open Excel file while the main display is on?'
    })

    if (response === 0) {
      return // User canceled
    }
  }
  // Close and clear the file watcher
  if (watcher) {
    watcher.close()
    watcher = null
  }

  // Clear the file path and reset data
  data.state.excelPath = ''
  data.state.currentSlideIndex = 0
  data.cards = []
  data.names = []

  // Update configuration
  config.set('state.excelPath', '')
  config.set('state.currentSlideIndex', 0)

  // Update title and send data to renderer
  sendData()

  // Close display windows since there's no data to show
  if (mainDisplayWindow && !mainDisplayWindow.isDestroyed()) {
    mainDisplayWindow.close()
    mainDisplayWindow = null
  }

  if (sideDisplayWindow && !sideDisplayWindow.isDestroyed()) {
    sideDisplayWindow.close()
    sideDisplayWindow = null
  }

  // Recreate the application menu to update the "Close Excel File" enabled state
  createApplicationMenu()
}

// Helper function to get filename without extension
function getFileNameWithoutExtension(filePath: string): string {
  if (!filePath) return ''
  return path.basename(filePath, path.extname(filePath))
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

    // Update the main window title with Excel filename and slide position
    if (data.cards && data.cards.length > 0) {
      const slidePosition = `${data.state.currentSlideIndex + 1}/${data.cards.length}`
      const filename = getFileNameWithoutExtension(data.state.excelPath || '')
      const title = filename
        ? `${filename} (Slide ${slidePosition})`
        : `DualPresenter (Slide ${slidePosition})`
      mainWindow.setTitle(title)
    } else {
      mainWindow.setTitle('DualPresenter')
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
      ? `${process.env['ELECTRON_RENDERER_URL']}/#/mainscreen`
      : `file://${join(__dirname, '../renderer/index.html')}#/mainscreen`

  if (!mainDisplayWindow || mainDisplayWindow.isDestroyed()) {
    // Create new window for main display
    mainDisplayWindow = new BrowserWindow({
      x: targetMonitor.bounds.x,
      y: targetMonitor.bounds.y,
      width: targetMonitor.bounds.width,
      height: targetMonitor.bounds.height,
      frame: false,
      fullscreen: true,
      title: 'Main Screen',
      show: false,
      backgroundColor: '#000000',
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false
      }
    })
    mainDisplayWindow.on('ready-to-show', () => {
      mainDisplayWindow.show()
    })
    mainDisplayWindow.loadURL(url)

    mainDisplayWindow.webContents.on('did-finish-load', () => {
      if (mainDisplayWindow) {
        mainDisplayWindow.webContents.send('display-data', {
          type: 'main',
          currentSlideIndex: data.state.currentSlideIndex,
          cards: data.cards,
          names: data.names,
          config: data.config,
          state: {
            blackOutScreens: data.state.blackOutScreens
          }
        })
      }
    })
    mainDisplayWindow.on('focus', () => {
      // When main screen gets focus, redirect focus back to main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.focus()
      }
    })
  } else {
    // Reposition if needed
    mainDisplayWindow.setBounds(targetMonitor.bounds)

    // Ensure fullscreen is maintained
    if (!mainDisplayWindow.isFullScreen()) {
      mainDisplayWindow.setFullScreen(true)
    }

    // Update content
    mainDisplayWindow.webContents.send('display-data', {
      type: 'main',
      currentSlideIndex: data.state.currentSlideIndex,
      cards: data.cards,
      names: data.names,
      config: data.config,
      state: {
        blackOutScreens: data.state.blackOutScreens
      }
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
      ? `${process.env['ELECTRON_RENDERER_URL']}/#/sidescreen`
      : `file://${join(__dirname, '../renderer/index.html')}#/sidescreen`

  if (!sideDisplayWindow || sideDisplayWindow.isDestroyed()) {
    sideDisplayWindow = new BrowserWindow({
      x: targetMonitor.bounds.x,
      y: targetMonitor.bounds.y,
      width: targetMonitor.bounds.width,
      height: targetMonitor.bounds.height,
      frame: false,
      fullscreen: true,
      title: 'Side Screen',
      show: false,
      backgroundColor: '#000000',
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false
      }
    })
    sideDisplayWindow.on('ready-to-show', () => {
      sideDisplayWindow.show()
    })
    sideDisplayWindow.loadURL(url)

    sideDisplayWindow.webContents.on('did-finish-load', () => {
      if (sideDisplayWindow && !sideDisplayWindow.isDestroyed()) {
        // Ensure fullscreen is set after content is loaded
        sideDisplayWindow.setFullScreen(true)

        sideDisplayWindow.webContents.send('display-data', {
          type: 'side',
          currentSlideIndex: data.state.currentSlideIndex,
          cards: data.cards,
          names: data.names,
          config: data.config,
          state: {
            blackOutScreens: data.state.blackOutScreens
          }
        })
      }
    })

    sideDisplayWindow.on('focus', () => {
      // When side screen gets focus, redirect focus back to main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.focus()
      }
    })
  } else {
    // Reposition if needed
    sideDisplayWindow.setBounds(targetMonitor.bounds)

    // Ensure fullscreen is maintained
    if (!sideDisplayWindow.isFullScreen()) {
      sideDisplayWindow.setFullScreen(true)
    }

    sideDisplayWindow.webContents.send('display-data', {
      type: 'side',
      currentSlideIndex: data.state.currentSlideIndex,
      cards: data.cards,
      names: data.names,
      config: data.config,
      state: {
        blackOutScreens: data.state.blackOutScreens
      }
    })
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
    width: 974,
    height: 855,
    title: 'Settings',
    parent: mainWindow || undefined,
    modal: true, // Make it a modal window to keep it pinned to the parent
    movable: true, // Allow it to be moved but still attached to the parent
    frame: true,
    resizable: true,
    fullscreenable: false,
    minimizable: false, // Disable minimize button since it's pinned
    maximizable: false,
    show: false,
    backgroundColor: '#111827',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  // Remove the window menu
  settingsWindow.setMenu(null)

  settingsWindow.on('ready-to-show', () => {
    settingsWindow.show()
  })

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

// Create Excel Structure window
function createExcelStructureWindow(): void {
  // Close the existing window if it's open
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return
  }

  // Create a new Excel structure window
  const excelStructureWindow = new BrowserWindow({
    width: 974,
    height: 855,
    title: 'Excel File Structure',
    parent: mainWindow || undefined,
    modal: true, // Make it a modal window to keep it pinned to the parent
    movable: true, // Allow it to be moved but still attached to the parent
    frame: true,
    resizable: true,
    fullscreenable: false,
    minimizable: false, // Disable minimize button since it's pinned
    maximizable: false,
    show: false,
    backgroundColor: '#111827',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  // Remove the window menu
  excelStructureWindow.setMenu(null)

  excelStructureWindow.on('ready-to-show', () => {
    excelStructureWindow.show()
  })

  // Load the excel structure URL
  const excelStructureUrl =
    is.dev && process.env['ELECTRON_RENDERER_URL']
      ? `${process.env['ELECTRON_RENDERER_URL']}/#/excel-structure`
      : `file://${join(__dirname, '../renderer/index.html')}#/excel-structure`

  excelStructureWindow.loadURL(excelStructureUrl)

  // Handle window close
  excelStructureWindow.on('closed', () => {
    // Nothing to do here
  })
}

// Function to update the checked state of the Freeze Output menu item
function updateFreezeState(isChecked: boolean): void {
  const menu = Menu.getApplicationMenu()
  if (!menu) return

  // Find the Actions menu
  const actionsMenu = menu.items.find((item) => item.label === 'Actions')
  if (!actionsMenu || !actionsMenu.submenu) return

  // Find the Freeze Output menu item and update its checked state
  const freeze = actionsMenu.submenu.items.find((item) => item.label === 'Freeze Output')
  if (freeze) {
    freeze.checked = isChecked
  }
}

// Function to update the checked state of the Black Out Screens menu item
function updateBlackOutState(isChecked: boolean): void {
  const menu = Menu.getApplicationMenu()
  if (!menu) return

  // Find the Actions menu
  const actionsMenu = menu.items.find((item) => item.label === 'Actions')
  if (!actionsMenu || !actionsMenu.submenu) return

  // Find the Black Out Screens menu item and update its checked state
  const blackOut = actionsMenu.submenu.items.find((item) => item.label === 'Black Out Screens')
  if (blackOut) {
    blackOut.checked = isChecked
  }
}

// Create application menu with Actions menu
function createApplicationMenu(): void {
  // Get the default application menu first
  const defaultMenu = Menu.getApplicationMenu() || Menu.buildFromTemplate([])

  // Create our custom File menu
  const customFileMenu: Electron.MenuItemConstructorOptions = {
    label: 'File',
    submenu: [
      {
        label: 'Open Excel File...',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          // Open file dialog directly from the main process
          const filePath = dialog.showOpenDialogSync({
            title: 'Select Excel File',
            properties: ['openFile'],
            filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx', 'xlsm'] }]
          })?.[0]

          if (filePath) {
            data.state.excelPath = filePath
            config.set('state.excelPath', filePath)
            // Set currentSlideIndex to 0 when opening a new Excel file
            data.state.currentSlideIndex = 0
            config.set('state.currentSlideIndex', 0)
            loadData()

            // Recreate the application menu to update the "Close Excel File" enabled state
            createApplicationMenu()
          }
        }
      },
      {
        label: 'Close Excel File',
        accelerator: 'CmdOrCtrl+W',
        enabled: !!data.state.excelPath,
        click: closeExcelFile
      },
      {
        label: 'Refresh Data',
        accelerator: 'CmdOrCtrl+R',
        enabled: data.cards.length > 0, // Disable when no Excel is loaded
        click: () => {
          // Call loadData directly
          loadData()
        }
      },
      { type: 'separator' },
      {
        label: 'Excel File Structure',
        click: () => {
          createExcelStructureWindow()
        }
      },
      {
        label: 'Settings',
        accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+P',
        click: () => {
          createSettingsWindow()
        }
      },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }

  // Create our custom Actions menu
  const actionsMenu: Electron.MenuItemConstructorOptions = {
    label: 'Actions',
    submenu: [
      {
        label: 'Delete All Previews',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('clear-previews')
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Freeze Output',
        accelerator: 'CommandOrControl+Shift+F',
        type: 'checkbox',
        checked: data.state.freezeMonitors,
        enabled: data.cards.length > 0, // Disable when no Excel is loaded
        click: () => {
          data.state.freezeMonitors = !data.state.freezeMonitors
          config.set('state.freezeMonitors', data.state.freezeMonitors)

          // Store the current slide index when freezing, clear it when unfreezing
          if (data.state.freezeMonitors) {
            data.state.frozenSlideIndex = data.state.currentSlideIndex
            config.set('state.frozenSlideIndex', data.state.frozenSlideIndex)
          } else {
            data.state.frozenSlideIndex = null
            config.set('state.frozenSlideIndex', null)
          }

          // Update menu item checked state
          updateFreezeState(data.state.freezeMonitors)

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('data-updated', data)
          }

          if (!data.state.freezeMonitors) {
            updateDisplayWindows()
          }
        }
      },
      {
        label: 'Black Out Screens',
        accelerator: 'CommandOrControl+B',
        type: 'checkbox',
        checked: data.state.blackOutScreens,
        enabled: data.cards.length > 0, // Disable when no Excel is loaded
        click: () => {
          data.state.blackOutScreens = !data.state.blackOutScreens
          config.set('state.blackOutScreens', data.state.blackOutScreens)

          // Update menu item checked state
          updateBlackOutState(data.state.blackOutScreens)

          // Send updated state to renderer
          sendData()

          // Update both display windows to apply or remove the black out
          if (mainDisplayWindow && !mainDisplayWindow.isDestroyed()) {
            mainDisplayWindow.webContents.send('black-out-changed', data.state.blackOutScreens)
          }

          if (sideDisplayWindow && !sideDisplayWindow.isDestroyed()) {
            sideDisplayWindow.webContents.send('black-out-changed', data.state.blackOutScreens)
          }
        }
      },
      {
        label: 'Flip Screens',
        accelerator: 'CommandOrControl+Shift+X',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('flip-screens')
          }
        }
      }
    ]
  }

  // Create our custom Navigation menu
  const navigationMenu: Electron.MenuItemConstructorOptions = {
    label: 'Navigation',
    submenu: [
      {
        label: 'Previous Slide',
        accelerator: 'Left',
        click: () => {
          if (data.state.currentSlideIndex > 0) {
            data.state.currentSlideIndex--
            config.set('state.currentSlideIndex', data.state.currentSlideIndex)
            sendData()
            updateDisplayWindows()
          }
        }
      },
      {
        label: 'Next Slide',
        accelerator: 'Right',
        click: () => {
          if (data.state.currentSlideIndex < data.cards.length - 1) {
            data.state.currentSlideIndex++
            config.set('state.currentSlideIndex', data.state.currentSlideIndex)
            sendData()
            updateDisplayWindows()
          }
        }
      }
    ]
  }

  // Extract all existing menus from the defaultMenu
  const defaultMenus = Array.from(defaultMenu.items)
  const menuTemplate: Electron.MenuItemConstructorOptions[] = []

  // Special handling for macOS app menu (must be first)
  if (process.platform === 'darwin') {
    // Look for the app menu in the default menu
    const appMenu = defaultMenus.find((item) => item.role === 'appMenu' || item.label === app.name)
    if (appMenu) {
      // Use the default app menu
      menuTemplate.push(appMenu)
    } else {
      // Create a standard macOS app menu
      menuTemplate.push({
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      })
    }
  }

  // Add our customized File menu
  menuTemplate.push(customFileMenu)

  // Add the rest of the default menus except File (which we replaced),
  // and also skip any duplicate Actions or Navigation menus
  for (const menuItem of defaultMenus) {
    const label = menuItem.label || ''

    // Skip the app menu (already added for macOS), our custom menus, and any empty menus
    if (
      label !== app.name &&
      label !== 'File' &&
      label !== 'Actions' &&
      label !== 'Navigation' &&
      menuItem.submenu
    ) {
      menuTemplate.push(menuItem)
    }
  }

  // Add our custom Actions and Navigation menus
  menuTemplate.push(actionsMenu, navigationMenu)

  // Finally, for Windows/Linux, add standard Window and Help menus if they don't exist
  if (process.platform !== 'darwin') {
    const hasWindowMenu = menuTemplate.some(
      (item) => item.role === 'windowMenu' || item.label === 'Window'
    )

    if (!hasWindowMenu) {
      menuTemplate.push({
        label: 'Window',
        submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'close' }]
      })
    }
  }

  // Remove Help menu if it exists
  const helpMenuIndex = menuTemplate.findIndex((item) => item.label === 'Help')
  if (helpMenuIndex !== -1) {
    menuTemplate.splice(helpMenuIndex, 1)
  }

  // Build and set the application menu
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
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
      // Send message to scroll to current slide in the UI
      mainWindow?.webContents.send('scroll-to-current')
    }
  })

  // For next slide: Control+Shift+Right
  globalShortcut.register('CommandOrControl+Shift+Right', () => {
    if (data.state.currentSlideIndex < data.cards.length - 1) {
      data.state.currentSlideIndex++
      config.set('state.currentSlideIndex', data.state.currentSlideIndex)
      sendData()
      updateDisplayWindows()
      // Send message to scroll to current slide in the UI
      mainWindow?.webContents.send('scroll-to-current')
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

    // Store the current slide index when freezing, clear it when unfreezing
    if (data.state.freezeMonitors) {
      data.state.frozenSlideIndex = data.state.currentSlideIndex
      config.set('state.frozenSlideIndex', data.state.frozenSlideIndex)
    } else {
      data.state.frozenSlideIndex = null
      config.set('state.frozenSlideIndex', null)
    }

    // Update menu item checked state
    updateFreezeState(data.state.freezeMonitors)

    // Send data to update UI indicators in renderer
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
  // Load saved window state from config
  const savedWindowState = data.state.windowBounds || {
    width: 1024,
    height: 913
  }

  // Create the browser window with saved dimensions
  mainWindow = new BrowserWindow({
    width: savedWindowState.width,
    height: savedWindowState.height,
    x: savedWindowState.x,
    y: savedWindowState.y,
    minWidth: 1024,
    minHeight: 913,
    title: 'DualPresenter',
    show: false,
    backgroundColor: '#111827',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  // Check if window should be maximized
  if (data.state.isMaximized) {
    mainWindow.maximize()
  }

  // Save window position and size when changed
  mainWindow.on('resize', saveWindowState)
  mainWindow.on('move', saveWindowState)

  // Save maximize/unmaximize state
  mainWindow.on('maximize', () => {
    data.state.isMaximized = true
    config.set('state.isMaximized', true)
  })

  mainWindow.on('unmaximize', () => {
    data.state.isMaximized = false
    config.set('state.isMaximized', false)
    saveWindowState()
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Add a close event handler to confirm closing if excel is loaded and displays are active
  mainWindow.on('close', (e) => {
    // If there's an Excel file open and a main display is assigned
    if (data.state.excelPath && data.state.mainScreen) {
      e.preventDefault() // Prevent default close behavior

      // Show confirmation dialog
      const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Cancel', 'Exit'],
        title: 'Confirm Exit',
        message:
          'A project is currently open and displays are active. Are you sure you want to exit?'
      })

      // Only exit if user confirmed with "Close"
      if (response === 1) {
        // Force quit by calling app.exit() which exits immediately
        app.exit(0)
      }
      // If canceled (response === 0), do nothing and keep the app running
    } else {
      // If no Excel file is open or no main display is assigned, just quit the app
      app.exit(0)
    }
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

// Function to save window state (position and size)
function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMaximized()) {
    return
  }

  const bounds = mainWindow.getBounds()
  data.state.windowBounds = bounds
  config.set('state.windowBounds', bounds)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Get monitors
  updateMonitorList()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.miagg')

  // Add handler for before-quit to show confirmation dialog if needed
  app.on('before-quit', (e) => {
    // If Excel file is open and display is assigned, show confirmation
    if (data.state.excelPath && data.state.mainScreen) {
      e.preventDefault() // Prevent the default quit behavior

      // Show confirmation dialog
      const response = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ['Cancel', 'Exit'],
        title: 'Confirm Exit',
        message:
          'A project is currently open and displays are active. Are you sure you want to exit?'
      })

      // Only exit if user confirmed with "Close"
      if (response === 1) {
        // Force quit by calling app.exit() which exits immediately
        app.exit(0)
      }
      // If canceled (response === 0), do nothing and keep the app running
    }
  })

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
      // Send message to scroll to current slide in the UI
      mainWindow?.webContents.send('scroll-to-current')
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

    // Store the current slide index when freezing, clear it when unfreezing
    if (data.state.freezeMonitors) {
      data.state.frozenSlideIndex = data.state.currentSlideIndex
      config.set('state.frozenSlideIndex', data.state.frozenSlideIndex)
    } else {
      data.state.frozenSlideIndex = null
      config.set('state.frozenSlideIndex', null)
    }

    // Update menu item checked state
    updateFreezeState(data.state.freezeMonitors)

    sendData()

    if (!data.state.freezeMonitors) {
      updateDisplayWindows()
    }
  })

  ipcMain.on('open-excel', () => {
    const filePath = dialog.showOpenDialogSync({
      title: 'Select Excel File',
      properties: ['openFile'],
      filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx', 'xlsm'] }]
    })?.[0]

    if (filePath) {
      data.state.excelPath = filePath
      config.set('state.excelPath', filePath)
      // Set currentSlideIndex to 0 when opening a new Excel file
      data.state.currentSlideIndex = 0
      config.set('state.currentSlideIndex', 0)
      loadData()

      // Recreate the application menu to update the "Close Excel File" enabled state
      createApplicationMenu()
    }
  })

  ipcMain.on('refresh-data', loadData)

  ipcMain.on('update-config', (_, newConfig) => {
    data.config = newConfig
    config.set('config', newConfig)
    sendData()
    updateDisplayWindows()

    // Trigger regeneration of all slide previews when config changes
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('regenerate-previews')
    }

    // Update settings window if it's open
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('settings-data', data.config)
    }
  })

  ipcMain.on('toggle-black-out', () => {
    data.state.blackOutScreens = !data.state.blackOutScreens
    config.set('state.blackOutScreens', data.state.blackOutScreens)

    // Update menu item checked state
    updateBlackOutState(data.state.blackOutScreens)

    // Send updated state to renderer
    sendData()

    // Update both display windows to apply or remove the black out
    if (mainDisplayWindow && !mainDisplayWindow.isDestroyed()) {
      mainDisplayWindow.webContents.send('black-out-changed', data.state.blackOutScreens)
    }

    if (sideDisplayWindow && !sideDisplayWindow.isDestroyed()) {
      sideDisplayWindow.webContents.send('black-out-changed', data.state.blackOutScreens)
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

  // Add handler for opening Excel structure window
  ipcMain.on('open-excel-structure', () => {
    createExcelStructureWindow()
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
        console.error('Invalid file path:', filePath)
        return null
      }

      // Normalize path - ensure it's an absolute path
      let resolvedPath = filePath
      if (!path.isAbsolute(filePath)) {
        // If it's a relative path, resolve it relative to the app directory
        resolvedPath = path.resolve(app.getAppPath(), filePath)
      }

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        console.error(`File does not exist: ${resolvedPath}`)
        return null
      }

      // Read the file
      const data = fs.readFileSync(resolvedPath)

      // Determine mime type based on extension
      let mimeType = 'image/png' // Default
      if (
        resolvedPath.toLowerCase().endsWith('.jpg') ||
        resolvedPath.toLowerCase().endsWith('.jpeg')
      ) {
        mimeType = 'image/jpeg'
      } else if (resolvedPath.toLowerCase().endsWith('.gif')) {
        mimeType = 'image/gif'
      } else if (resolvedPath.toLowerCase().endsWith('.svg')) {
        mimeType = 'image/svg+xml'
      }

      // Convert to data URL
      const dataUrl = `data:${mimeType};base64,${data.toString('base64')}`
      return dataUrl
    } catch (error) {
      console.error('Error loading image:', error)
      return null
    }
  })

  // Add handlers for slide preview operations
  ipcMain.handle('save-slide-preview', async (_, dataUrl: string, hash: string) => {
    try {
      // Parse the data URL to get the base64 data
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URL format')
      }

      const imageData = Buffer.from(matches[2], 'base64')
      const filePath = path.join(previewsDir, `slide_preview_${hash}.png`)

      // Write the file
      fs.writeFileSync(filePath, imageData)

      return filePath
    } catch (error) {
      console.error('Error saving slide preview:', error)
      throw error
    }
  })

  ipcMain.handle('check-slide-preview', async (_, hash: string) => {
    const filePath = path.join(previewsDir, `slide_preview_${hash}.png`)
    return fs.existsSync(filePath)
  })

  ipcMain.handle('get-slide-preview-path', async (_, hash: string) => {
    return path.join(previewsDir, `slide_preview_${hash}.png`)
  })

  // New handler for showing confirmation dialog
  ipcMain.handle(
    'show-confirm-dialog',
    async (_, title: string, message: string, buttons: string[]) => {
      const { response } = await dialog.showMessageBox({
        type: 'question',
        title,
        message,
        buttons,
        defaultId: 0,
        cancelId: 0
      })

      // Return true if the non-cancel button was clicked (typically index 1 for "Delete All")
      return response === 1
    }
  )

  // New handler for clearing all slide preview images
  ipcMain.handle('clear-all-slide-previews', async () => {
    try {
      // Get all files in the previews directory
      const files = fs.readdirSync(previewsDir)

      // Filter for PNG files that match the slide preview pattern
      const previewFiles = files.filter(
        (file) => file.startsWith('slide_preview_') && file.endsWith('.png')
      )

      // Keep track of how many files we delete
      let deletedCount = 0

      // Delete each file
      for (const file of previewFiles) {
        const filePath = path.join(previewsDir, file)
        fs.unlinkSync(filePath)
        deletedCount++
      }

      return deletedCount
    } catch (error) {
      console.error('Error clearing slide preview images:', error)
      throw error
    }
  })

  // Add handler for flip-screens command from the application menu
  ipcMain.on('flip-screens', () => {
    if (!data.state.mainScreen && !data.state.sideScreen) {
      return // Nothing to flip if no screens are assigned
    }

    // Store current values
    const tempMain = data.state.mainScreen
    const tempSide = data.state.sideScreen

    // Close both display windows first
    if (mainDisplayWindow && !mainDisplayWindow.isDestroyed()) {
      mainDisplayWindow.close()
      mainDisplayWindow = null
    }

    if (sideDisplayWindow && !sideDisplayWindow.isDestroyed()) {
      sideDisplayWindow.close()
      sideDisplayWindow = null
    }

    // Swap the screens
    data.state.mainScreen = tempSide
    data.state.sideScreen = tempMain

    // Update configuration
    config.set('state.mainScreen', data.state.mainScreen)
    config.set('state.sideScreen', data.state.sideScreen)

    // Notify renderer of the change
    sendData()

    // Update display windows
    updateDisplayWindows()
  })

  // Add handler for saving template file to user location
  ipcMain.handle('save-excel-template', async () => {
    try {
      const templatePath = join(app.getAppPath(), 'resources', 'template.xlsm')

      // Ensure the template exists
      if (!fs.existsSync(templatePath)) {
        throw new Error('Template file not found')
      }

      // Open save dialog to get destination path
      const result = await dialog.showSaveDialog({
        title: 'Save Excel Template',
        defaultPath: 'template.xlsm',
        filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx', 'xlsm'] }]
      })

      // If user canceled, exit
      if (result.canceled || !result.filePath) {
        return { success: false, message: 'Operation canceled' }
      }

      // Copy the template to the selected location
      fs.copyFileSync(templatePath, result.filePath)

      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('Error saving template:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Set Dark mode
  nativeTheme.themeSource = 'dark'

  // Register global shortcuts when app is ready
  registerGlobalShortcuts()

  loadData()
  createWindow()
  createApplicationMenu()

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
