import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  screen,
  dialog,
  nativeTheme,
  powerSaveBlocker
} from 'electron'
import {
  createApplicationMenu,
  updateFreezeState,
  updateBlackOutState,
  updateAudibleNamesState,
  updateAutoPlaybackState
} from './menu'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// Import electron-updater correctly as a CommonJS module
const { autoUpdater } = require('electron-updater')
import icon from '../../build/icon.png?asset'
import config from './config'
import { parseExcel } from './utils'
import { Data } from './interfaces/Data'
import { audioManager } from './utils/audioManager'
import { editExcelFile } from './utils/excelEditor'
import { dialogDirectory, rememberDialogPath, saveDialogPath } from './utils/dialogPaths'
import { ndiOutput, DEFAULT_NDI_FRAME_RATE } from './ndiOutput'
import { CardType } from './enums/CardType'
import { DisplayType } from './enums/DisplayType'
import { filterNamesForCard } from '../shared/nameFilters'
import fileWatcher from 'chokidar'
import fs from 'fs'
import path from 'path'
import { RemoteControl, startRemoteControl } from './remoteControl'

let mainWindow: BrowserWindow | null = null
let mainDisplayWindow: BrowserWindow | null = null
let sideDisplayWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let excelStructureWindow: BrowserWindow | null = null
let audioWindow: BrowserWindow | null = null
let watcher: fileWatcher.FSWatcher | null = null
let lastModifiedTime: Date | null = null
let fileCheckInterval: NodeJS.Timeout | null = null
let debounceTimer: NodeJS.Timeout | null = null
let isQuittingForUpdate = false // Add this flag
let remoteControl: RemoteControl | null = null

// Names page of each screen as the renderer reports it (page is zero-based, total 0 = no pages)
interface PageInfo {
  page: number
  total: number
  // Type of the card the screen shows
  type: string | null
}
// Screen previews shown on Stream Deck keys. The renderer only watches and captures a preview
// panel while a key for it is on the deck.
type PreviewScreens = { main: boolean; side: boolean }
let previewSubscriptions: PreviewScreens = { main: false, side: false }

function setPreviewSubscriptions(next: PreviewScreens): void {
  previewSubscriptions = next
  mainWindow?.webContents.send('remote-preview-subscribe', next)
}

// Whether the search box in the main window is open, as the renderer reports it
let remoteSearchOpen = false
let remotePageInfo: { main: PageInfo; side: PageInfo } = {
  main: { page: 0, total: 0, type: null },
  side: { page: 0, total: 0, type: null }
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
if (data.state.currentMainNamesPage === undefined) data.state.currentMainNamesPage = 0
if (data.state.currentMainUnattendedPage === undefined) data.state.currentMainUnattendedPage = 0
if (data.state.currentSideNamesPage === undefined) data.state.currentSideNamesPage = 0
if (data.state.currentSideUnattendedPage === undefined) data.state.currentSideUnattendedPage = 0

// Initialize audible names config if needed
if (data.config.audibleNames === undefined) {
  data.config.audibleNames = {
    enabled: false,
    delayBeforePlayback: 1000,
    gapBetweenNames: 500,
    autoPlayback: true,
    continuousPlayback: true
  }
}

// Initialize distributed names config if needed
if (data.config.distributeNames === undefined) {
  data.config.distributeNames = true
  config.set('config.distributeNames', true)
}

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

  // Update display windows to handle monitor disconnections
  updateDisplayWindows()
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

  sendData()
  updateDisplayWindows()

  // Preload audio for the current card
  preloadCurrentCardAudio()
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
  createApplicationMenu(
    data,
    mainWindow,
    loadData,
    closeExcelFile,
    createSettingsWindow,
    createExcelStructureWindow,
    updateDisplayWindows,
    sendData,
    config,
    autoUpdater,
    preloadCurrentCardAudio
  )
}

// Helper function to get filename without extension
function getFileNameWithoutExtension(filePath: string): string {
  if (!filePath) return ''
  return path.basename(filePath, path.extname(filePath))
}

// Helper function to reset pagination state
function resetPaginationState(): void {
  data.state.currentMainNamesPage = 0
  data.state.currentMainUnattendedPage = 0
  data.state.currentSideNamesPage = 0
  data.state.currentSideUnattendedPage = 0
  config.set('state.currentMainNamesPage', 0)
  config.set('state.currentMainUnattendedPage', 0)
  config.set('state.currentSideNamesPage', 0)
  config.set('state.currentSideUnattendedPage', 0)
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

  remoteControl?.notify()
}

// Start, stop or adjust the NDI output to match the settings
function applyNdiConfig(): void {
  ndiOutput.setFrameRate(data.config.ndiFrameRate ?? DEFAULT_NDI_FRAME_RATE)
  ndiOutput.setEnabled(data.config.ndiOutput ?? false)
}

// Content for the main and side display pages (physical displays and NDI output)
function mainDisplayPayload(): Record<string, unknown> {
  return {
    type: 'main',
    currentSlideIndex: data.state.currentSlideIndex,
    cards: data.cards,
    names: data.names,
    config: data.config,
    state: {
      blackOutScreens: data.state.blackOutScreens,
      currentMainNamesPage: data.state.currentMainNamesPage,
      currentMainUnattendedPage: data.state.currentMainUnattendedPage
    },
    audioStatus: audioManager.getPlaybackStatus()
  }
}

function sideDisplayPayload(): Record<string, unknown> {
  return {
    type: 'side',
    currentSlideIndex: data.state.currentSlideIndex,
    cards: data.cards,
    names: data.names,
    config: data.config,
    state: {
      blackOutScreens: data.state.blackOutScreens,
      currentSideNamesPage: data.state.currentSideNamesPage,
      currentSideUnattendedPage: data.state.currentSideUnattendedPage
    },
    audioStatus: audioManager.getPlaybackStatus()
  }
}

function updateDisplayWindows(): void {
  remoteControl?.notify()

  if (data.state.freezeMonitors) {
    return
  }

  ndiOutput.update('main', mainDisplayPayload())
  ndiOutput.update('side', sideDisplayPayload())

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
  if (!targetMonitor) {
    // Monitor was disconnected - close the window and clear the selection
    if (mainDisplayWindow && !mainDisplayWindow.isDestroyed()) {
      mainDisplayWindow.close()
      mainDisplayWindow = null
    }
    // Clear the main screen selection since the monitor is no longer available
    data.state.mainScreen = null
    config.set('state.mainScreen', null)
    sendData()
    return
  }

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
      thickFrame: false,
      roundedCorners: false,
      alwaysOnTop: true,
      fullscreenable: false,
      enableLargerThanScreen: true,
      title: 'Main Screen',
      show: false,
      backgroundColor: '#000000',
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false
      }
    })
    mainDisplayWindow.on('ready-to-show', () => {
      mainDisplayWindow.setAlwaysOnTop(true, 'screen-saver')
      mainDisplayWindow.setFullScreenable(false)
      mainDisplayWindow.moveTop()
      mainDisplayWindow.show()
    })
    mainDisplayWindow.loadURL(url)

    mainDisplayWindow.webContents.on('did-finish-load', () => {
      if (mainDisplayWindow) {
        mainDisplayWindow.webContents.send('display-data', mainDisplayPayload())
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

    // Ensure always-on-top is maintained
    if (!mainDisplayWindow.isAlwaysOnTop()) {
      mainDisplayWindow.setAlwaysOnTop(true, 'screen-saver')
      mainDisplayWindow.setFullScreenable(false)
      mainDisplayWindow.moveTop()
    }

    // Update content
    mainDisplayWindow.webContents.send('display-data', mainDisplayPayload())
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
  if (!targetMonitor) {
    // Monitor was disconnected - close the window and clear the selection
    if (sideDisplayWindow && !sideDisplayWindow.isDestroyed()) {
      sideDisplayWindow.close()
      sideDisplayWindow = null
    }
    // Clear the side screen selection since the monitor is no longer available
    data.state.sideScreen = null
    config.set('state.sideScreen', null)
    sendData()
    return
  }

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
      thickFrame: false,
      roundedCorners: false,
      alwaysOnTop: true,
      fullscreenable: false,
      enableLargerThanScreen: true,
      title: 'Side Screen',
      show: false,
      backgroundColor: '#000000',
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false
      }
    })

    sideDisplayWindow.on('ready-to-show', () => {
      sideDisplayWindow.setAlwaysOnTop(true, 'screen-saver')
      sideDisplayWindow.setFullScreenable(false)
      sideDisplayWindow.moveTop()
      sideDisplayWindow.show()
    })
    sideDisplayWindow.loadURL(url)

    sideDisplayWindow.webContents.on('did-finish-load', () => {
      if (sideDisplayWindow && !sideDisplayWindow.isDestroyed()) {
        sideDisplayWindow.webContents.send('display-data', sideDisplayPayload())
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

    // Ensure always-on-top is maintained
    if (!sideDisplayWindow.isAlwaysOnTop()) {
      sideDisplayWindow.setAlwaysOnTop(true, 'screen-saver')
      sideDisplayWindow.setFullScreenable(false)
      sideDisplayWindow.moveTop()
    }

    sideDisplayWindow.webContents.send('display-data', sideDisplayPayload())
  }
}

// Settings and Excel Structure open as dialogs over the main window: clicking outside them (on
// the main window) closes them, and the main window is dimmed meanwhile
const DIALOG_WIDTH = 974
const DIALOG_HEIGHT = 855
// Focus that arrives right after a dialog appears comes from opening it (e.g. the Stream Deck
// brings the main window forward first), not from a click outside
const DIALOG_FOCUS_GRACE_MS = 500
const dialogShownAt = new WeakMap<BrowserWindow, number>()

function openDialogWindows(): BrowserWindow[] {
  return [settingsWindow, excelStructureWindow].filter(
    (win): win is BrowserWindow => !!win && !win.isDestroyed()
  )
}

function notifyDialogWindows(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('dialog-window-open', openDialogWindows().length > 0)
  }
}

function closeDialogWindows(): void {
  const now = Date.now()
  for (const win of openDialogWindows()) {
    const shownAt = dialogShownAt.get(win)
    if (shownAt !== undefined && now - shownAt > DIALOG_FOCUS_GRACE_MS) win.close()
  }
}

// Options shared by the dialog windows: centred over the main window
function dialogWindowOptions(title: string): Electron.BrowserWindowConstructorOptions {
  const parentBounds = mainWindow && !mainWindow.isDestroyed() ? mainWindow.getBounds() : null
  return {
    width: DIALOG_WIDTH,
    height: DIALOG_HEIGHT,
    ...(parentBounds
      ? {
          x: Math.round(parentBounds.x + (parentBounds.width - DIALOG_WIDTH) / 2),
          y: Math.round(parentBounds.y + Math.max(0, (parentBounds.height - DIALOG_HEIGHT) / 2))
        }
      : {}),
    title,
    // macOS 27.2 stutters while dragging child windows, so dialogs are standalone there
    // TODO: restore `parent: mainWindow || undefined` on all platforms once Apple fixes this
    ...(process.platform !== 'darwin' ? { parent: mainWindow || undefined } : {}),
    frame: true,
    resizable: true,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    backgroundColor: '#1c1c1e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  }
}

// Tracks a dialog window for click-outside closing and the main window backdrop
function trackDialogWindow(win: BrowserWindow): void {
  win.on('show', () => {
    dialogShownAt.set(win, Date.now())
    notifyDialogWindows()
  })
  win.on('closed', () => {
    if (settingsWindow === win) settingsWindow = null
    if (excelStructureWindow === win) excelStructureWindow = null
    notifyDialogWindows()
  })
}

function createSettingsWindow(): void {
  // Close the existing window if it's open
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return
  }

  // Create a new settings window
  settingsWindow = new BrowserWindow(dialogWindowOptions('Settings'))
  trackDialogWindow(settingsWindow)

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
}

// Create Excel Structure window
function createExcelStructureWindow(): void {
  // Focus the existing window if it's open
  if (excelStructureWindow && !excelStructureWindow.isDestroyed()) {
    excelStructureWindow.focus()
    return
  }

  // Create a new Excel structure window
  excelStructureWindow = new BrowserWindow(dialogWindowOptions('Excel File Structure'))
  trackDialogWindow(excelStructureWindow)

  // Remove the window menu
  excelStructureWindow.setMenu(null)

  excelStructureWindow.on('ready-to-show', () => {
    excelStructureWindow?.show()
  })

  // Load the excel structure URL
  const excelStructureUrl =
    is.dev && process.env['ELECTRON_RENDERER_URL']
      ? `${process.env['ELECTRON_RENDERER_URL']}/#/excel-structure`
      : `file://${join(__dirname, '../renderer/index.html')}#/excel-structure`

  excelStructureWindow.loadURL(excelStructureUrl)
}

function openExcelFile(): void {
  const filePath = dialog.showOpenDialogSync({
    title: 'Select Excel File',
    defaultPath: dialogDirectory(data),
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx', 'xlsm'] }]
  })?.[0]

  if (filePath) {
    // Stop any ongoing audio playback when opening a new Excel file
    audioManager.stopPlayback()
    data.state.excelPath = filePath
    config.set('state.excelPath', filePath)
    rememberDialogPath(data, filePath)
    // Set currentSlideIndex to 0 when opening a new Excel file
    data.state.currentSlideIndex = 0
    config.set('state.currentSlideIndex', 0)
    loadData()

    // Recreate the application menu to update the "Close Excel File" enabled state
    createApplicationMenu(
      data,
      mainWindow,
      loadData,
      closeExcelFile,
      createSettingsWindow,
      createExcelStructureWindow,
      updateDisplayWindows,
      sendData,
      config,
      autoUpdater,
      preloadCurrentCardAudio
    )
  }
}

function focusMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
  app.focus({ steal: true })
}

// Runs an action that may show a modal dialog. Dialogs block the main process until they are
// closed, so wait until the Stream Deck has been answered, and bring the app forward first.
function withDialog(action: () => void): () => void {
  return () => {
    setImmediate(() => {
      focusMainWindow()
      action()
    })
  }
}

function goToSlide(index: number): void {
  if (index >= 0 && index < data.cards.length) {
    data.state.currentSlideIndex = index
    config.set('state.currentSlideIndex', data.state.currentSlideIndex)
    resetPaginationState()
    sendData()
    updateDisplayWindows()
    preloadCurrentCardAudio()
    // Send message to scroll to current slide in the UI
    mainWindow?.webContents.send('scroll-to-current')
  }
}

function toggleFreeze(): void {
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
}

function toggleBlackOut(): void {
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

  ndiOutput.setBlackOut(data.state.blackOutScreens)
}

function flipScreens(): void {
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
}

// Persist a config change made outside the renderer and push it everywhere it is shown
function applyConfigChange(): void {
  config.set('config', data.config)
  sendData()
  updateDisplayWindows()
  applyNdiConfig()

  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('settings-data', data.config)
  }
}

function cardLabel(index: number): string | null {
  const card = data.cards[index]
  if (!card) return null
  return card.title || card.group || card.type
}

// State snapshot sent to the Stream Deck plugin
function getRemoteState(): object {
  const audio = audioManager.getPlaybackStatus()
  const index = data.state.currentSlideIndex
  const card = data.cards[index]

  return {
    app: 'DualPresenter',
    version: app.getVersion(),
    excelLoaded: data.cards.length > 0,
    fileName: getFileNameWithoutExtension(data.state.excelPath || ''),
    slide: {
      index,
      count: data.cards.length,
      type: card?.type ?? null,
      title: cardLabel(index),
      subtitle: card?.subtitle ?? null,
      previousTitle: cardLabel(index - 1),
      nextTitle: cardLabel(index + 1),
      titles: data.cards.map((_, i) => cardLabel(i))
    },
    blackOut: data.state.blackOutScreens,
    freeze: data.state.freezeMonitors,
    frozenSlideIndex: data.state.frozenSlideIndex,
    settingsOpen: !!settingsWindow && !settingsWindow.isDestroyed(),
    searchOpen: remoteSearchOpen,
    screens: {
      main: !!data.state.mainScreen,
      side: !!data.state.sideScreen
    },
    audibleNames: {
      enabled: data.config.audibleNames.enabled,
      autoPlayback: data.config.audibleNames.autoPlayback,
      continuousPlayback: data.config.audibleNames.continuousPlayback,
      available: card?.type === CardType.Names || card?.type === CardType.Unattended,
      // Last name of a "Side Only" names card is being read: those cards leave the main screen
      // blank, so the app frames its preview red (isLastNameSpeaking in App.vue)
      lastName:
        card?.type === CardType.Names &&
        card.display === DisplayType.SideOnly &&
        (audio.isPlaying || audio.isPaused) &&
        audio.totalNames > 0 &&
        audio.currentIndex === audio.totalNames - 1,
      isPlaying: audio.isPlaying,
      isPaused: audio.isPaused,
      currentIndex: audio.currentIndex,
      totalNames: audio.totalNames,
      // The name at currentIndex, as the app's audio bar shows it next to the position
      currentName: audio.queuedName ?? null
    },
    namesPrecedence: data.config.namesPrecedence,
    transitions: {
      enabled: !!data.config.slideTransitions,
      duration: data.config.transitionDuration ?? 400
    },
    ndi: {
      enabled: !!data.config.ndiOutput,
      frameRate: data.config.ndiFrameRate ?? DEFAULT_NDI_FRAME_RATE
    },
    pages: remotePageInfo
  }
}

// Actions the Stream Deck plugin can run
const remoteActions = {
  'next-slide': () => goToSlide(data.state.currentSlideIndex + 1),
  'prev-slide': () => goToSlide(data.state.currentSlideIndex - 1),
  'goto-slide': ({ index }) => goToSlide(Number(index)),
  'toggle-black-out': toggleBlackOut,
  'toggle-freeze': toggleFreeze,
  'flip-screens': flipScreens,
  'reload-data': loadData,
  'focus-app': focusMainWindow,
  // The plugin reports which screen previews have a key on the deck
  'set-previews': ({ main, side }) =>
    setPreviewSubscriptions({ main: main === true, side: side === true }),
  'toggle-search': () => {
    // Bring the app forward so the search box can be typed in straight away
    if (!remoteSearchOpen) focusMainWindow()
    mainWindow?.webContents.send('remote-toggle-search')
  },
  'open-excel': withDialog(openExcelFile),
  'close-excel': withDialog(closeExcelFile),
  'open-settings': withDialog(createSettingsWindow),
  'edit-excel': () => editExcelFile(data),
  'toggle-audible-names': () => {
    data.config.audibleNames.enabled = !data.config.audibleNames.enabled
    updateAudibleNamesState(data.config.audibleNames.enabled)
    if (!data.config.audibleNames.enabled) audioManager.stopPlayback()
    applyConfigChange()
    preloadCurrentCardAudio()
  },
  'toggle-transitions': () => {
    data.config.slideTransitions = !data.config.slideTransitions
    applyConfigChange()
  },
  'toggle-ndi': () => {
    data.config.ndiOutput = !data.config.ndiOutput
    applyConfigChange()
  },
  'toggle-continuous-playback': () => {
    data.config.audibleNames.continuousPlayback = !data.config.audibleNames.continuousPlayback
    applyConfigChange()
  },
  'toggle-auto-playback': () => {
    data.config.audibleNames.autoPlayback = !data.config.audibleNames.autoPlayback
    updateAutoPlaybackState(data.config.audibleNames.autoPlayback)
    applyConfigChange()
  },
  // The renderer decides which names belong to the current card, so it starts playback
  'toggle-audio-playback': () => mainWindow?.webContents.send('toggle-audio-playback'),
  'stop-audio': () => {
    audioManager.stopPlayback()
    updateDisplayWindows()
  },
  'next-name': () => {
    audioManager.goToNext()
    updateDisplayWindows()
  },
  'prev-name': () => {
    audioManager.goToPrevious()
    updateDisplayWindows()
  },
  // Page counts depend on the rendered cards, so paging is done by the renderer
  'next-page': ({ screen }) =>
    mainWindow?.webContents.send('remote-change-page', { screen, direction: 1 }),
  'prev-page': ({ screen }) =>
    mainWindow?.webContents.send('remote-change-page', { screen, direction: -1 }),
  'precedence-up': () => {
    data.config.namesPrecedence = data.config.namesPrecedence + 1
    applyConfigChange()
  },
  'precedence-down': () => {
    data.config.namesPrecedence = Math.max(0, data.config.namesPrecedence - 1)
    applyConfigChange()
  }
} satisfies Record<string, (params: Record<string, unknown>) => void>

// Menu functions are now imported from './menu'

// Keyboard shortcuts for the main window that have no menu item. Like the menu shortcuts, they
// only work while DualPresenter is focused.
function handleAppShortcuts(event: Electron.Event, input: Electron.Input): void {
  if (input.type !== 'keyDown' || input.alt) return
  const modifier = process.platform === 'darwin' ? input.meta : input.control
  if (!modifier || !input.shift) return

  // Reload data
  if (input.key.toLowerCase() === 'r') {
    event.preventDefault()
    loadData()
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
    backgroundColor: '#1c1c1e',
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
    }
  })

  // Handle main window closed - ensure app exits
  // Clicking the main window while a dialog window is open closes the dialog
  mainWindow.on('focus', closeDialogWindows)

  mainWindow.on('closed', () => {
    mainWindow = null
    // Close all other windows and quit the app
    if (audioWindow) {
      audioWindow.close()
    }
    if (settingsWindow) {
      settingsWindow.close()
    }
    // Force quit the app
    app.quit()
  })

  mainWindow.webContents.on('before-input-event', handleAppShortcuts)

  // A reloaded page starts without preview watchers; tell it which previews are wanted
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('remote-preview-subscribe', previewSubscriptions)
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

// Function to create the hidden audio window
function createAudioWindow(): void {
  audioWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false, // Hidden window
    webPreferences: {
      preload: join(__dirname, '../preload/audio.mjs'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Load the audio player HTML file
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // In development, load from src
    audioWindow.loadFile(join(__dirname, '../../src/audio/audio-player.html'))
  } else {
    // In production, load from build output
    audioWindow.loadFile(join(__dirname, '../audio/audio-player.html'))
  }

  // Set up the audio manager with this window
  audioManager.setAudioWindow(audioWindow)

  audioWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('Audio window failed to load:', errorCode, errorDescription)
  })

  audioWindow.on('closed', () => {
    audioWindow = null
  })
}

// Function to preload audio for the current card
function preloadCurrentCardAudio(): void {
  if (!data.state.excelPath || !data.config.audibleNames.enabled) {
    return
  }

  const currentCard = data.cards[data.state.currentSlideIndex]
  if (!currentCard) {
    return
  }

  const voiceoverFolder = path.join(path.dirname(data.state.excelPath), 'voiceover')

  // Check if voiceover folder exists
  if (!fs.existsSync(voiceoverFolder)) {
    return
  }

  // Set the audio manager configuration with the correct voiceover folder
  audioManager.setConfiguration(
    data.config.audibleNames.delayBeforePlayback,
    data.config.audibleNames.gapBetweenNames,
    voiceoverFolder,
    data.config.audibleNames.continuousPlayback
  )

  // Get names for the current card
  let namesToPreload: any[] = []

  if (currentCard.type === CardType.Names) {
    // For names cards, use the filterNamesForCard function to get the relevant names
    const filteredNames = filterNamesForCard(data.names, currentCard)
    namesToPreload = filteredNames.map((name) => ({ name: name.name }))
  } else if (currentCard.type === CardType.Unattended) {
    // For unattended cards, preload all unattended names
    namesToPreload = data.names
      .filter((name) => !name.attending)
      .map((name) => ({ name: name.name }))
  }

  if (namesToPreload.length > 0) {
    audioManager.preloadCardAudio(namesToPreload)
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
  // Set up audio manager callback to update displays when audio status changes
  audioManager.setStatusChangeCallback(() => {
    updateDisplayWindows()
  })

  // Get monitors
  updateMonitorList()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.miagg')

  // Configure auto-updater behavior
  autoUpdater.logger = console
  autoUpdater.autoDownload = true

  // Handle update events
  autoUpdater.on('checking-for-update', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'checking' })
    }
  })

  autoUpdater.on('update-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', {
        status: 'available',
        info
      })
    }
  })

  autoUpdater.on('update-not-available', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'not-available' })
    }
  })

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', {
        status: 'downloading',
        progress: progressObj
      })
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Show a notification that an update is ready
      const response = dialog.showMessageBoxSync({
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded. Restart the application to apply the updates.',
        buttons: ['Restart Now', 'Later']
      })

      const shouldRestart = response === 0

      mainWindow.webContents.send('update-status', {
        status: 'downloaded',
        info
      })

      // Handle the actual restart separate from the window checks
      if (shouldRestart) {
        // Set the flag before calling quitAndInstall
        isQuittingForUpdate = true
        // Set a small timeout to allow the update status to be sent
        setTimeout(() => {
          // For all platforms, use quitAndInstall with the right parameters
          // - isSilent = false: shows a standard OS dialog during installation
          // - isForceRunAfter = true: forces app to restart after update
          autoUpdater.quitAndInstall(false, true)
        }, 100)
      }
    }
  })

  autoUpdater.on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        error: err.message
      })
    }
  })

  // Check for updates unless on MacOS
  if (process.platform !== 'darwin') {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('Error checking for updates:', err)
    })
  }

  // Add handler for manually checking updates
  ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('Error checking for updates:', err)

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', {
          status: 'error',
          error: err.message
        })
      }
    })
  })

  // Ad handler for before-quit to show confirmation dialog if needed
  app.on('before-quit', (e) => {
    // If quitting for an update, bypass the confirmation dialog
    if (isQuittingForUpdate) {
      return
    }

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
      resetPaginationState()
      sendData()
      updateDisplayWindows()
      preloadCurrentCardAudio()
    }
  })

  ipcMain.on('prev-slide', () => {
    if (data.state.currentSlideIndex > 0) {
      data.state.currentSlideIndex--
      config.set('state.currentSlideIndex', data.state.currentSlideIndex)
      resetPaginationState()
      sendData()
      updateDisplayWindows()
      preloadCurrentCardAudio()
    }
  })

  ipcMain.on('goto-slide', (_, index: number) => goToSlide(index))

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

  ipcMain.on('toggle-freeze', toggleFreeze)

  // The renderer asks for a preview panel to be captured after it changed
  ipcMain.on(
    'remote-preview-capture',
    async (_, screen: keyof PreviewScreens, rect: Electron.Rectangle) => {
      if (!previewSubscriptions[screen] || !mainWindow || mainWindow.isDestroyed()) return
      try {
        const image = await mainWindow.webContents.capturePage(rect)
        if (image.isEmpty()) return
        // Twice the key's width, so a key that crops the preview to fill itself stays sharp
        const key = image.resize({ width: 288, quality: 'good' })
        remoteControl?.sendPreview(
          screen,
          `data:image/jpeg;base64,${key.toJPEG(85).toString('base64')}`,
          key.getSize()
        )
      } catch (error) {
        console.error('Could not capture screen preview:', error)
      }
    }
  )

  ipcMain.on('remote-search-open', (_, open: boolean) => {
    remoteSearchOpen = open
    remoteControl?.notify()
  })

  // The renderer reports the names page each screen shows, for the Stream Deck keys
  ipcMain.on('remote-page-info', (_, info) => {
    remotePageInfo = info
    remoteControl?.notify()
  })

  // Pagination handlers
  ipcMain.on('update-pagination', (_, paginationState) => {
    data.state.currentMainNamesPage = paginationState.currentMainNamesPage
    data.state.currentMainUnattendedPage = paginationState.currentMainUnattendedPage
    data.state.currentSideNamesPage = paginationState.currentSideNamesPage
    data.state.currentSideUnattendedPage = paginationState.currentSideUnattendedPage

    config.set('state.currentMainNamesPage', paginationState.currentMainNamesPage)
    config.set('state.currentMainUnattendedPage', paginationState.currentMainUnattendedPage)
    config.set('state.currentSideNamesPage', paginationState.currentSideNamesPage)
    config.set('state.currentSideUnattendedPage', paginationState.currentSideUnattendedPage)

    sendData()

    if (!data.state.freezeMonitors) {
      updateDisplayWindows()
    }
  })

  ipcMain.on('open-excel', openExcelFile)

  ipcMain.on('reload-data', () => {
    loadData()
  })

  ipcMain.on('update-config', (_, newConfig) => {
    data.config = newConfig
    config.set('config', newConfig)
    sendData()
    updateDisplayWindows()
    applyNdiConfig()

    // Update settings window if it's open
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('settings-data', data.config)
    }
  })

  ipcMain.on('toggle-black-out', toggleBlackOut)

  // Add the file selection handler for settings
  ipcMain.handle('select-file', async (event, options) => {
    // Attached to the asking window, so it keeps focus and is not closed as a click outside
    const parent = BrowserWindow.fromWebContents(event.sender)
    const dialogOptions = { defaultPath: dialogDirectory(data), ...options }
    const result = parent
      ? await dialog.showOpenDialog(parent, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)
    if (!result.canceled) rememberDialogPath(data, result.filePaths[0])
    return result
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
  ipcMain.on('close-dialog-windows', closeDialogWindows)

  ipcMain.on('close-settings', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close()
      settingsWindow = null
    }
  })

  // Add handlers for state management
  ipcMain.handle('get-state', () => {
    return config.get('state')
  })

  ipcMain.handle('update-state', (_, stateUpdate) => {
    const currentState = config.get('state') || {}
    const newState = { ...currentState, ...stateUpdate }
    config.set('state', newState)
    return newState
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

  // Add handler for flip-screens command from the application menu
  ipcMain.on('flip-screens', flipScreens)

  // Add handler for saving template file to user location
  ipcMain.handle('save-excel-template', async (event) => {
    try {
      const templatePath = join(app.getAppPath(), 'resources', 'template.xlsx')

      // Ensure the template exists
      if (!fs.existsSync(templatePath)) {
        throw new Error('Template file not found')
      }

      // Open save dialog to get destination path
      const saveOptions = {
        title: 'Save Excel Template',
        defaultPath: saveDialogPath(data, 'template.xlsx'),
        filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx', 'xlsm'] }]
      }
      const parent = BrowserWindow.fromWebContents(event.sender)
      const result = parent
        ? await dialog.showSaveDialog(parent, saveOptions)
        : await dialog.showSaveDialog(saveOptions)

      // If user canceled, exit
      if (result.canceled || !result.filePath) {
        return { success: false, message: 'Operation canceled' }
      }

      // Copy the template to the selected location
      fs.copyFileSync(templatePath, result.filePath)
      rememberDialogPath(data, result.filePath)

      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('Error saving template:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  ipcMain.handle('save-excel-client-template', async (event) => {
    try {
      const templatePath = join(app.getAppPath(), 'resources', 'template_for_client.xlsx')

      // Ensure the template exists
      if (!fs.existsSync(templatePath)) {
        throw new Error('Template file not found')
      }

      // Open save dialog to get destination path
      const saveOptions = {
        title: 'Save Excel Template',
        defaultPath: saveDialogPath(data, 'template_for_client.xlsx'),
        filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx', 'xlsm'] }]
      }
      const parent = BrowserWindow.fromWebContents(event.sender)
      const result = parent
        ? await dialog.showSaveDialog(parent, saveOptions)
        : await dialog.showSaveDialog(saveOptions)

      // If user canceled, exit
      if (result.canceled || !result.filePath) {
        return { success: false, message: 'Operation canceled' }
      }

      // Copy the template to the selected location
      fs.copyFileSync(templatePath, result.filePath)
      rememberDialogPath(data, result.filePath)

      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('Error saving template:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Audible Names IPC handlers
  ipcMain.on('audio-play-names', (_, names) => {
    if (data.config.audibleNames.enabled && data.state.excelPath) {
      // Always stop any existing audio playback before starting manual playback
      audioManager.stopPlayback()

      const voiceoverFolder = path.join(path.dirname(data.state.excelPath), 'voiceover')
      // For manual playback, don't use the configured delay - start immediately
      audioManager.setConfiguration(
        0, // No delay for manual playback
        data.config.audibleNames.gapBetweenNames,
        voiceoverFolder,
        data.config.audibleNames.continuousPlayback
      )
      audioManager.playNamesSequence(names)
      // Update displays to reflect new audio status
      updateDisplayWindows()
    }
  })

  ipcMain.on('audio-stop', () => {
    audioManager.stopPlayback()
    // Update displays to reflect new audio status
    updateDisplayWindows()
  })

  // Add audio file handling IPC
  ipcMain.handle('audio-check-file-exists', async (_, filePath: string) => {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('audio-get-file-url', async (_, filePath: string) => {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK)
      // Convert to proper file URL for the current platform
      const fileUrl = new URL(`file://${filePath}`).href
      return fileUrl
    } catch (error) {
      console.warn(`Audio file not found: ${filePath}`)
      return null
    }
  })

  ipcMain.on('audio-pause', () => {
    audioManager.pausePlayback()
    // Update displays to reflect new audio status
    updateDisplayWindows()
  })

  ipcMain.on('audio-resume', () => {
    audioManager.resumePlayback()
    // Update displays to reflect new audio status
    updateDisplayWindows()
  })

  ipcMain.on('audio-next', () => {
    audioManager.goToNext()
    updateDisplayWindows()
  })

  ipcMain.on('audio-previous', () => {
    audioManager.goToPrevious()
    updateDisplayWindows()
  })

  ipcMain.handle('audio-get-status', () => {
    return audioManager.getPlaybackStatus()
  })

  // Handle audio status updates from the audio window
  ipcMain.on('audio-status', (_, type: string, data: any) => {
    if (type === 'status-update') {
      // Update the audio manager's internal state
      audioManager.updateStatus(data)
      // Update displays to reflect new audio status
      updateDisplayWindows()
    } else if (type === 'preload-complete') {
      // Audio preloading completed successfully
    }
  })

  // Set Dark mode
  nativeTheme.themeSource = 'dark'

  loadData()
  createWindow()
  createAudioWindow()
  applyNdiConfig()
  createApplicationMenu(
    data,
    mainWindow,
    loadData,
    closeExcelFile,
    createSettingsWindow,
    createExcelStructureWindow,
    updateDisplayWindows,
    sendData,
    config,
    autoUpdater,
    preloadCurrentCardAudio
  )

  // Prevent sleeping while the app is running
  powerSaveBlocker.start('prevent-display-sleep')

  // Local API for the Stream Deck plugin
  remoteControl = startRemoteControl(getRemoteState, remoteActions, () =>
    setPreviewSubscriptions({ main: false, side: false })
  )

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
  if (watcher) {
    watcher.close()
  }
  if (fileCheckInterval) {
    clearInterval(fileCheckInterval)
  }
  remoteControl?.close()
  ndiOutput.stop()
})
