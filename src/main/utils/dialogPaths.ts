import fs from 'fs'
import path from 'path'
import config from '../config'
import { Data } from '../interfaces/Data'

// Every open and save dialog starts in the folder of the last file picked or saved in any of
// them. Electron has no setting for this, and what the OS remembers on its own varies by
// platform and dialog, so the folder is kept in the app state.

// Folder to start a dialog in, or undefined to let the OS choose
export const dialogDirectory = (data: Data): string | undefined => {
  const candidates = [
    data.state.lastDialogDirectory,
    // Saved by earlier versions, which only remembered the Excel folder
    data.state.lastExcelDirectory,
    data.state.excelPath ? path.dirname(data.state.excelPath) : undefined
  ]
  return candidates.find((dir): dir is string => !!dir && fs.existsSync(dir))
}

// Start path for a save dialog: the remembered folder plus the suggested file name
export const saveDialogPath = (data: Data, fileName: string): string => {
  const dir = dialogDirectory(data)
  return dir ? path.join(dir, fileName) : fileName
}

// Remembers the folder of a file picked or saved in a dialog
export const rememberDialogPath = (data: Data, filePath: string | undefined): void => {
  if (!filePath) return
  data.state.lastDialogDirectory = path.dirname(filePath)
  config.set('state.lastDialogDirectory', data.state.lastDialogDirectory)
}
