import { Menu, app, dialog, shell, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import icon from '../../build/icon.png?asset'
import { Data } from './interfaces/Data'

// Function to update the checked state of the Freeze Output menu item
export function updateFreezeState(isChecked: boolean): void {
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
export function updateBlackOutState(isChecked: boolean): void {
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
export function createApplicationMenu(
  data: Data,
  mainWindow: BrowserWindow | null,
  loadData: () => void,
  closeExcelFile: () => void,
  createSettingsWindow: () => void,
  createExcelStructureWindow: () => void,
  updateDisplayWindows: () => void,
  sendData: () => void,
  config: any,
  autoUpdater: any
): void {
  // Get the default application menu first
  const defaultMenu = Menu.getApplicationMenu() || Menu.buildFromTemplate([])

  // Create our custom File menu - different for macOS vs Windows/Linux
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
              autoUpdater
            )
          }
        }
      },
      {
        label: 'Edit Excel File',
        accelerator: 'CmdOrCtrl+E',
        enabled: !!data.state.excelPath,
        click: () => {
          if (data.state.excelPath) {
            shell.openExternal(`file://${data.state.excelPath}`)
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
      // Only show these items in File menu for Windows/Linux, not for macOS
      ...(process.platform !== 'darwin'
        ? [
            {
              label: 'Check for Updates',
              click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('update-status', { status: 'checking' })
                }
                autoUpdater.checkForUpdatesAndNotify().catch((err: Error) => {
                  console.error('Error checking for updates:', err)

                  if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('update-status', {
                      status: 'error',
                      error: err.message
                    })
                  }
                })
              }
            },
            { type: 'separator' },
            {
              label: 'Settings',
              accelerator: 'Ctrl+P',
              click: () => {
                createSettingsWindow()
              }
            }
          ]
        : []),
      { type: 'separator' },
      ...(process.platform !== 'darwin' ? [{ role: 'quit' }] : [])
    ]
  }

  // Create our custom Actions menu
  const actionsMenu: Electron.MenuItemConstructorOptions = {
    label: 'Actions',
    submenu: [
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
          // Use the same IPC message that the renderer button uses
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('toggle-black-out')
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
      },
      { type: 'separator' },
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
    // For macOS, we create a custom app menu with our additional items
    menuTemplate.push({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('update-status', { status: 'checking' })
            }
            autoUpdater.checkForUpdatesAndNotify().catch((err: Error) => {
              console.error('Error checking for updates:', err)

              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('update-status', {
                  status: 'error',
                  error: err.message
                })
              }
            })
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'Cmd+,',
          click: () => {
            createSettingsWindow()
          }
        },
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
  menuTemplate.push(actionsMenu)

  // Finally, for Windows/Linux, add standard Window and Help menus if they don't exist
  if (process.platform !== 'darwin') {
    const hasWindowMenu = menuTemplate.some(
      (item) => item.role === 'windowMenu' || item.label === 'Window'
    )

    if (!hasWindowMenu) {
      menuTemplate.push({
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          { type: 'separator' },
          { role: 'close' },
          { type: 'separator' }
        ]
      })
    }
  }

  // Remove Help menu from its current position to add it later at the end
  const helpMenuIndex = menuTemplate.findIndex((item) => item.label === 'Help')
  let helpMenu = null
  if (helpMenuIndex !== -1) {
    // Store the Help menu definition
    helpMenu = {
      label: 'Help',
      submenu: [
        {
          label: 'Excel File Structure',
          click: () => {
            createExcelStructureWindow()
          }
        },
        { type: 'separator' },
        ...(process.platform !== 'darwin'
          ? [
              {
                label: 'About DualPresenter',
                click: () => {
                  dialog.showMessageBox({
                    title: 'About DualPresenter',
                    message: 'DualPresenter',
                    detail: `Version: ${app.getVersion()}\n\nA dual-screen presentation app for managing slides across multiple displays.`,
                    buttons: ['OK'],
                    icon: icon
                  })
                }
              }
            ]
          : [])
      ]
    }

    // Remove the Help menu from its current position
    menuTemplate.splice(helpMenuIndex, 1)
  }

  // Remove view menu when not running in dev mode
  const viewMenuIndex = menuTemplate.findIndex((item) => item.label === 'View')
  if (viewMenuIndex !== -1 && !is.dev) {
    menuTemplate.splice(viewMenuIndex, 1)
  }

  // Add Help menu at the end if it exists
  if (helpMenu) {
    menuTemplate.push(helpMenu)
  }

  // Build and set the application menu
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
}
