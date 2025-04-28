import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      loadImageAsDataUrl: (filePath: string) => Promise<string | null>
      saveSlidePreview: (dataUrl: string, hash: string) => Promise<string>
      checkSlidePreview: (hash: string) => Promise<boolean>
      getSlidePreviewPath: (hash: string) => Promise<string>
      clearAllSlidePreviewImages: () => Promise<number>
      showConfirmDialog: (title: string, message: string, buttons: string[]) => Promise<boolean>
    }
  }
}
