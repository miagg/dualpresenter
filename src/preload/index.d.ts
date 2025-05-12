import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      loadImageAsDataUrl: (filePath: string) => Promise<string | null>
      showConfirmDialog: (title: string, message: string, buttons: string[]) => Promise<boolean>
    }
  }
}
