import { BrowserWindow } from 'electron'
import { Name } from '../models/Name'

export class AudioManager {
  private isPlaying: boolean = false
  private isPaused: boolean = false
  private audioWindow: BrowserWindow | null = null
  private playbackQueue: Name[] = []
  private currentIndex: number = 0
  private delayBeforePlayback: number = 1000
  private gapBetweenNames: number = 500
  private voiceoverFolder: string = ''
  private continuousPlayback: boolean = true
  private onStatusChangeCallback: (() => void) | null = null
  private lastSpokenName: string | null = null
  private currentStatus: any = {}

  constructor() {
    // Audio window will be initialized by the main process
    this.audioWindow = null
  }

  setStatusChangeCallback(callback: (() => void) | null): void {
    this.onStatusChangeCallback = callback
  }

  setAudioWindow(audioWindow: BrowserWindow): void {
    this.audioWindow = audioWindow
  }

  updateStatus(data: any): void {
    this.currentStatus = data
    this.isPlaying = data.isPlaying
    this.isPaused = data.isPaused
    this.currentIndex = data.currentIndex
    this.playbackQueue = data.totalNames > 0 ? new Array(data.totalNames) : []
    this.lastSpokenName = data.lastSpokenName

    // Notify status change
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback()
    }
  }

  private notifyStatusChange(): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback()
    }
  }

  setConfiguration(
    delayBeforePlayback: number,
    gapBetweenNames: number,
    voiceoverFolder: string,
    continuousPlayback: boolean = true
  ): void {
    this.delayBeforePlayback = delayBeforePlayback
    this.gapBetweenNames = gapBetweenNames
    this.voiceoverFolder = voiceoverFolder
    this.continuousPlayback = continuousPlayback
  }

  async playNamesSequence(names: Name[]): Promise<void> {
    if (!this.audioWindow || this.audioWindow.isDestroyed()) {
      console.error('Audio window not available')
      return
    }

    this.playbackQueue = names
    this.currentIndex = 0
    this.isPlaying = true
    this.isPaused = false

    // Send play command to audio window
    this.audioWindow.webContents.send('audio-command', 'play-names', {
      names,
      config: {
        delayBeforePlayback: this.delayBeforePlayback,
        gapBetweenNames: this.gapBetweenNames,
        continuousPlayback: this.continuousPlayback
      }
    })
  }

  preloadCardAudio(names: Name[]): void {
    if (!this.audioWindow || this.audioWindow.isDestroyed()) {
      // Retry after a short delay if the window isn't ready yet
      setTimeout(() => {
        if (this.audioWindow && !this.audioWindow.isDestroyed()) {
          this.preloadCardAudio(names)
        }
      }, 500)
      return
    }

    // Send preload command to audio window
    this.audioWindow.webContents.send('audio-command', 'preload-card', {
      names,
      voiceoverFolder: this.voiceoverFolder
    })
  }

  stopPlayback(): void {
    if (!this.audioWindow || this.audioWindow.isDestroyed()) {
      console.error('Audio window not available')
      return
    }

    this.isPlaying = false
    this.isPaused = false
    this.lastSpokenName = null
    this.currentIndex = 0
    this.playbackQueue = []

    // Send stop command to audio window
    this.audioWindow.webContents.send('audio-command', 'stop')

    // Notify that audio status has changed
    this.notifyStatusChange()
  }

  pausePlayback(): void {
    if (!this.audioWindow || this.audioWindow.isDestroyed()) {
      console.error('Audio window not available')
      return
    }

    if (this.isPlaying && !this.isPaused) {
      this.isPaused = true

      // Send pause command to audio window
      this.audioWindow.webContents.send('audio-command', 'pause')

      // Notify that audio status has changed
      this.notifyStatusChange()
    }
  }

  resumePlayback(): void {
    if (!this.audioWindow || this.audioWindow.isDestroyed()) {
      console.error('Audio window not available')
      return
    }

    if (this.isPlaying && this.isPaused) {
      this.isPaused = false

      // Send resume command to audio window
      this.audioWindow.webContents.send('audio-command', 'resume')
    }
  }

  goToNext(): void {
    if (!this.audioWindow || this.audioWindow.isDestroyed()) {
      console.error('Audio window not available')
      return
    }

    if (this.playbackQueue.length === 0) return

    // Send next command to audio window
    this.audioWindow.webContents.send('audio-command', 'next')
  }

  goToPrevious(): void {
    if (!this.audioWindow || this.audioWindow.isDestroyed()) {
      console.error('Audio window not available')
      return
    }

    if (this.playbackQueue.length === 0) return

    // Send previous command to audio window
    this.audioWindow.webContents.send('audio-command', 'previous')
  }

  getPlaybackStatus(): {
    isPlaying: boolean
    isPaused: boolean
    currentIndex: number
    totalNames: number
    currentName: string | null
    queuedName: string | null
    lastSpokenName: string | null
  } {
    // Return the most up-to-date status from the audio window
    if (this.currentStatus && Object.keys(this.currentStatus).length > 0) {
      return this.currentStatus
    }

    // Fallback to local state if audio window hasn't reported status yet
    let currentName: string | null = null
    let queuedName: string | null = null

    if (this.currentIndex < this.playbackQueue.length && this.currentIndex >= 0) {
      queuedName = this.playbackQueue[this.currentIndex]?.name || null
    }

    if (!this.continuousPlayback && this.isPaused && this.lastSpokenName) {
      currentName = this.lastSpokenName
    } else {
      currentName = queuedName
    }

    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      totalNames: this.playbackQueue.length,
      currentName,
      queuedName,
      lastSpokenName: this.lastSpokenName
    }
  }
}

// Export a singleton instance
export const audioManager = new AudioManager()
