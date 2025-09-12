import fs from 'fs'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'
import { Name } from '../models/Name'

export class AudioManager {
  private isPlaying: boolean = false
  private isPaused: boolean = false
  private currentAudio: ChildProcess | null = null
  private playbackQueue: Name[] = []
  private currentIndex: number = 0
  private delayBeforePlayback: number = 1000
  private gapBetweenNames: number = 500
  private voiceoverFolder: string = ''
  private playbackTimer: NodeJS.Timeout | null = null
  private isIntentionallyStopped: boolean = false
  private continuousPlayback: boolean = true

  constructor() {
    // Initialize audio player reference
    this.currentAudio = null
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
    this.playbackQueue = names
    this.currentIndex = 0
    this.isPlaying = true
    this.isPaused = false
    this.isIntentionallyStopped = false // Reset flag when starting new playback

    // Wait for the initial delay before starting playback
    this.playbackTimer = setTimeout(() => {
      this.playNextName()
    }, this.delayBeforePlayback)
  }

  private async playNextName(): Promise<void> {
    if (!this.isPlaying || this.currentIndex >= this.playbackQueue.length) {
      this.isPlaying = false
      return
    }

    const currentName = this.playbackQueue[this.currentIndex]
    const audioPath = this.getAudioPath(currentName.name)

    if (fs.existsSync(audioPath)) {
      try {
        await this.playAudioFile(audioPath)

        // Increment index immediately after audio finishes
        this.currentIndex++

        // Check if we've reached the end of the playlist
        if (this.currentIndex >= this.playbackQueue.length) {
          this.isPlaying = false
          this.isPaused = false
          return
        }

        // If continuous playback is disabled, pause here
        if (!this.continuousPlayback) {
          this.isPaused = true
          // Don't automatically play next name - wait for manual trigger
          return
        }

        // For continuous playback, wait for gap and play next
        this.playbackTimer = setTimeout(() => {
          this.playNextName()
        }, this.gapBetweenNames)
      } catch (error) {
        console.error(`Error playing audio for "${currentName.name}":`, error)
        // Skip to next name on error
        this.currentIndex++

        // Check if we've reached the end of the playlist
        if (this.currentIndex >= this.playbackQueue.length) {
          this.isPlaying = false
          this.isPaused = false
          return
        }

        if (!this.continuousPlayback) {
          this.isPaused = true
          return
        }

        this.playNextName()
      }
    } else {
      const sanitizedName = this.sanitizeName(currentName.name)
      const originalVsSanitized =
        currentName.name !== sanitizedName
          ? ` (sanitized from "${currentName.name}" to "${sanitizedName}")`
          : ''
      console.warn(
        `Audio file not found for "${currentName.name}"${originalVsSanitized}: ${audioPath}`
      )
      // Skip to next name if audio file doesn't exist
      this.currentIndex++

      // Check if we've reached the end of the playlist
      if (this.currentIndex >= this.playbackQueue.length) {
        this.isPlaying = false
        this.isPaused = false
        return
      }

      if (!this.continuousPlayback) {
        this.isPaused = true
        return
      }

      this.playNextName()
    }
  }

  private sanitizeName(name: string): string {
    // Trim leading and trailing whitespace
    let sanitized = name.trim()

    // Replace multiple consecutive spaces with single space
    sanitized = sanitized.replace(/\s+/g, ' ')

    // Remove or replace characters that are problematic in filenames
    // Keep alphanumeric (including Unicode), spaces, hyphens, underscores, and some punctuation
    // Remove only the most problematic characters for file systems
    sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '')

    // Remove any remaining leading/trailing dots that might cause issues
    sanitized = sanitized.replace(/^\.+|\.+$/g, '')

    // Final trim to ensure no leading/trailing spaces remain
    sanitized = sanitized.trim()

    return sanitized
  }

  private getAudioPath(nameName: string): string {
    // Sanitize the name before searching for audio files
    const sanitizedName = this.sanitizeName(nameName)

    // Try different audio extensions
    const extensions = ['.mp3', '.wav', '.m4a', '.aac']

    for (const ext of extensions) {
      const audioPath = path.join(this.voiceoverFolder, `${sanitizedName}${ext}`)
      if (fs.existsSync(audioPath)) {
        return audioPath
      }
    }

    // Default to .mp3 if none found (for error logging purposes)
    return path.join(this.voiceoverFolder, `${sanitizedName}.mp3`)
  }

  private playAudioFile(audioPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let audioProcess: ChildProcess

        // Determine the audio player command based on platform
        if (process.platform === 'darwin') {
          // macOS: use afplay
          audioProcess = spawn('afplay', [audioPath])
        } else if (process.platform === 'win32') {
          // Windows: use PowerShell with SoundPlayer
          audioProcess = spawn('powershell', [
            '-c',
            `(New-Object Media.SoundPlayer '${audioPath}').PlaySync()`
          ])
        } else {
          // Linux: use aplay or paplay
          audioProcess = spawn('aplay', [audioPath])
        }

        audioProcess.on('close', (code: number | null, signal: string | null) => {
          // If we intentionally stopped the audio, don't treat it as an error
          if (this.isIntentionallyStopped) {
            this.isIntentionallyStopped = false // Reset the flag
            resolve() // Resolve successfully since this was intentional
            return
          }

          // Handle common termination signals as intentional stops (not errors)
          if (signal === 'SIGINT' || signal === 'SIGTERM' || signal === 'SIGKILL') {
            resolve() // Resolve successfully since this was likely an intentional stop
            return
          }

          if (code === 0) {
            resolve()
          } else {
            reject(
              new Error(
                `Audio playbook failed with code ${code}${signal ? ` (signal: ${signal})` : ''}`
              )
            )
          }
        })

        audioProcess.on('error', (err: Error) => {
          // If we intentionally stopped the audio, don't treat it as an error
          if (this.isIntentionallyStopped) {
            this.isIntentionallyStopped = false // Reset the flag
            resolve() // Resolve successfully since this was intentional
            return
          }

          // Check if the error is due to the process being killed (common during slide changes)
          if (
            err.message &&
            (err.message.includes('SIGINT') ||
              err.message.includes('SIGTERM') ||
              err.message.includes('SIGKILL'))
          ) {
            resolve() // Resolve successfully since this was likely an intentional stop
            return
          }

          reject(err)
        })

        // Store reference for potential stopping
        this.currentAudio = audioProcess
      } catch (error) {
        reject(error)
      }
    })
  }

  stopPlayback(): void {
    this.isPlaying = false
    this.isPaused = false

    // Clear any pending timeout first
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer)
      this.playbackTimer = null
    }

    if (this.currentAudio) {
      try {
        // Set flag to indicate this is an intentional stop
        this.isIntentionallyStopped = true
        // Kill the audio process if it's running
        this.currentAudio.kill('SIGINT')
      } catch (error) {
        console.error('Error stopping audio:', error)
        // Reset flag if there was an error
        this.isIntentionallyStopped = false
      }
      this.currentAudio = null
    }

    this.currentIndex = 0
    this.playbackQueue = []
  }

  pausePlayback(): void {
    if (this.isPlaying && !this.isPaused) {
      this.isPaused = true

      // Clear any pending timeout
      if (this.playbackTimer) {
        clearTimeout(this.playbackTimer)
        this.playbackTimer = null
      }

      // Stop current audio if playing
      if (this.currentAudio) {
        try {
          this.isIntentionallyStopped = true
          this.currentAudio.kill('SIGINT')
        } catch (error) {
          console.error('Error pausing audio:', error)
          this.isIntentionallyStopped = false
        }
        this.currentAudio = null
      }
    }
  }

  resumePlayback(): void {
    if (this.isPlaying && this.isPaused) {
      this.isPaused = false

      // Continue with next name if we have more to play
      if (this.currentIndex < this.playbackQueue.length) {
        this.playNextName()
      } else {
        // We've reached the end
        this.isPlaying = false
      }
    }
  }

  goToNext(): void {
    if (this.playbackQueue.length === 0) return

    // Stop current audio
    if (this.currentAudio) {
      this.isIntentionallyStopped = true
      this.currentAudio.kill('SIGINT')
      this.currentAudio = null
    }

    // Clear any pending timer
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer)
      this.playbackTimer = null
    }

    // Move to next index if not at the end
    if (this.currentIndex < this.playbackQueue.length - 1) {
      this.currentIndex++

      // If we're in continuous mode and playing, continue playing
      if (this.continuousPlayback && this.isPlaying && !this.isPaused) {
        this.playNextName()
      }
    }
  }

  goToPrevious(): void {
    if (this.playbackQueue.length === 0) return

    // Stop current audio
    if (this.currentAudio) {
      this.isIntentionallyStopped = true
      this.currentAudio.kill('SIGINT')
      this.currentAudio = null
    }

    // Clear any pending timer
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer)
      this.playbackTimer = null
    }

    // Move to previous index if not at the beginning
    if (this.currentIndex > 0) {
      this.currentIndex--

      // If we're in continuous mode and playing, continue playing
      if (this.continuousPlayback && this.isPlaying && !this.isPaused) {
        this.playNextName()
      }
    }
  }

  getPlaybackStatus(): {
    isPlaying: boolean
    isPaused: boolean
    currentIndex: number
    totalNames: number
    currentName: string | null
  } {
    const currentName =
      this.currentIndex < this.playbackQueue.length && this.currentIndex >= 0
        ? this.playbackQueue[this.currentIndex]?.name || null
        : null

    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      totalNames: this.playbackQueue.length,
      currentName
    }
  }
}

// Export a singleton instance
export const audioManager = new AudioManager()
