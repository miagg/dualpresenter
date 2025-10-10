import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Listen for audio commands from main process
  onAudioCommand: (callback: (command: string, data: any) => void) => {
    ipcRenderer.on('audio-command', (_, command, data) => callback(command, data))
  },

  // Send audio status updates to main process
  audioStatus: (type: string, data: any) => {
    ipcRenderer.send('audio-status', type, data)
  },

  // Check if audio file exists
  checkFileExists: (filePath: string) => {
    return ipcRenderer.invoke('audio-check-file-exists', filePath)
  },

  // Get proper file URL for audio file
  getFileUrl: (filePath: string) => {
    return ipcRenderer.invoke('audio-get-file-url', filePath)
  }
})
