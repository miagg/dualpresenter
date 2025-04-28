import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  loadImageAsDataUrl: (filePath: string) => {
    return ipcRenderer.invoke('get-image-data', filePath)
  },
  saveSlidePreview: (dataUrl: string, hash: string) => {
    return ipcRenderer.invoke('save-slide-preview', dataUrl, hash)
  },
  checkSlidePreview: (hash: string) => {
    return ipcRenderer.invoke('check-slide-preview', hash)
  },
  getSlidePreviewPath: (hash: string) => {
    return ipcRenderer.invoke('get-slide-preview-path', hash)
  },
  clearAllSlidePreviewImages: () => {
    return ipcRenderer.invoke('clear-all-slide-previews')
  },
  showConfirmDialog: (title: string, message: string, buttons: string[]) => {
    return ipcRenderer.invoke('show-confirm-dialog', title, message, buttons)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
