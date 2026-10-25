import { BrowserWindow, NativeImage } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'

import type { Sender, VideoSendFrame } from '@stagetimerio/grandiose'

// The package's types leave out these runtime exports
type Grandiose = typeof import('@stagetimerio/grandiose') & {
  isSupportedCPU: () => boolean
  FOURCC_BGRX: number
  FORMAT_TYPE_PROGRESSIVE: number
}

export type NdiScreen = 'main' | 'side'

// Payload sent to a display page, the same one the physical display windows receive
type DisplayPayload = { cards?: unknown[] } & Record<string, unknown>

const WIDTH = 1920
const HEIGHT = 1080
// Frame rates offered in Settings
export const NDI_FRAME_RATES = [25, 30, 50, 60]
export const DEFAULT_NDI_FRAME_RATE = 50
// Frames are only rendered when something changes, so the last one is repeated now and then to
// keep receivers that expect a steady stream from treating the source as gone
const KEEPALIVE_MS = 1000

const SOURCE_NAMES: Record<NdiScreen, string> = {
  main: 'DualPresenter Main',
  side: 'DualPresenter Side'
}

interface Output {
  window: BrowserWindow
  sender: Sender | null
  frame: Buffer | null
  frameSize: { width: number; height: number }
  sending: boolean
  hasPendingFrame: boolean
  lastSentAt: number
  hasCards: boolean
}

// Renders the main and side screens in hidden offscreen windows and sends them as NDI sources.
// Nothing is created (and the NDI library is not loaded) while the output is disabled.
class NdiOutput {
  private enabled = false
  private grandiose: Grandiose | null = null
  private outputs: Partial<Record<NdiScreen, Output>> = {}
  private payloads: Partial<Record<NdiScreen, DisplayPayload>> = {}
  private blackOut = false
  private keepalive: ReturnType<typeof setInterval> | null = null
  private lastError: string | null = null
  private frameRate = DEFAULT_NDI_FRAME_RATE

  isEnabled(): boolean {
    return this.enabled
  }

  getLastError(): string | null {
    return this.lastError
  }

  // Applies right away, also while the output is running
  setFrameRate(frameRate: number): void {
    const next = NDI_FRAME_RATES.includes(frameRate) ? frameRate : DEFAULT_NDI_FRAME_RATE
    if (next === this.frameRate) return
    this.frameRate = next
    for (const output of Object.values(this.outputs)) {
      if (output && !output.window.isDestroyed()) output.window.webContents.setFrameRate(next)
    }
  }

  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled === this.enabled) return
    this.enabled = enabled

    if (!enabled) {
      await this.stop()
      return
    }

    try {
      if (!this.grandiose) {
        const module = await import('@stagetimerio/grandiose')
        this.grandiose = (module.default ?? module) as Grandiose
      }
      if (!this.grandiose.isSupportedCPU()) {
        throw new Error('This CPU is not supported by NDI')
      }
      this.lastError = null
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error)
      console.error('NDI output could not start:', this.lastError)
      this.enabled = false
      return
    }

    // Disabled again while the library was loading
    if (!this.enabled) return

    await Promise.all((['main', 'side'] as NdiScreen[]).map((screen) => this.startOutput(screen)))
    this.keepalive = setInterval(() => this.resendStaleFrames(), KEEPALIVE_MS)
  }

  // Called with every update the physical displays get (so freezing applies here too)
  update(screen: NdiScreen, payload: DisplayPayload): void {
    this.payloads[screen] = payload
    const output = this.outputs[screen]
    if (!output || output.window.isDestroyed()) return

    // The display page keeps its last slide when there are no cards, so start it over instead
    const hasCards = Array.isArray(payload.cards) && payload.cards.length > 0
    if (output.hasCards && !hasCards) {
      output.hasCards = false
      output.window.webContents.reload()
      return
    }
    output.hasCards = hasCards
    output.window.webContents.send('display-data', payload)
  }

  setBlackOut(blackOut: boolean): void {
    this.blackOut = blackOut
    for (const output of Object.values(this.outputs)) {
      if (output && !output.window.isDestroyed()) {
        output.window.webContents.send('black-out-changed', blackOut)
      }
    }
  }

  async stop(): Promise<void> {
    if (this.keepalive) {
      clearInterval(this.keepalive)
      this.keepalive = null
    }
    const outputs = Object.values(this.outputs)
    this.outputs = {}
    await Promise.all(
      outputs.map(async (output) => {
        if (!output) return
        if (!output.window.isDestroyed()) output.window.destroy()
        await output.sender?.destroy().catch(() => undefined)
      })
    )
  }

  private async startOutput(screen: NdiScreen): Promise<void> {
    const window = new BrowserWindow({
      width: WIDTH,
      height: HEIGHT,
      useContentSize: true,
      show: false,
      frame: false,
      backgroundColor: '#000000',
      webPreferences: {
        offscreen: true,
        backgroundThrottling: false,
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false
      }
    })

    const output: Output = {
      window,
      sender: null,
      frame: null,
      frameSize: { width: WIDTH, height: HEIGHT },
      sending: false,
      hasPendingFrame: false,
      lastSentAt: 0,
      hasCards: false
    }
    this.outputs[screen] = output

    try {
      const sender = await this.grandiose!.send({ name: SOURCE_NAMES[screen], clockVideo: false })
      // Output stopped while the sender was being created
      if (this.outputs[screen] !== output) {
        await sender.destroy().catch(() => undefined)
        return
      }
      output.sender = sender
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error)
      console.error(`NDI ${screen} sender could not start:`, this.lastError)
    }

    window.webContents.setFrameRate(this.frameRate)
    window.webContents.on('paint', (_event, _dirty, image: NativeImage) => {
      this.onPaint(output, image)
    })

    window.webContents.on('did-finish-load', () => {
      const payload = this.payloads[screen]
      if (payload) {
        output.hasCards = Array.isArray(payload.cards) && payload.cards.length > 0
        window.webContents.send('display-data', payload)
      }
      if (this.blackOut) window.webContents.send('black-out-changed', true)
    })

    const route = screen === 'main' ? 'mainscreen' : 'sidescreen'
    const url =
      is.dev && process.env['ELECTRON_RENDERER_URL']
        ? `${process.env['ELECTRON_RENDERER_URL']}/#/${route}`
        : `file://${join(__dirname, '../renderer/index.html')}#/${route}`
    window.loadURL(url)
  }

  private onPaint(output: Output, image: NativeImage): void {
    output.frame = image.toBitmap()
    output.frameSize = image.getSize()
    this.sendFrame(output)
  }

  // Sends the latest frame. While a frame is still being sent, newer ones replace each other
  // and only the most recent goes out next, so a slow network never builds up a backlog.
  private sendFrame(output: Output): void {
    if (!output.sender || !output.frame || !this.grandiose) return
    if (output.sending) {
      output.hasPendingFrame = true
      return
    }

    const { width, height } = output.frameSize
    output.sending = true
    output.hasPendingFrame = false
    output.lastSentAt = Date.now()

    output.sender
      .video({
        xres: width,
        yres: height,
        frameRateN: this.frameRate,
        frameRateD: 1,
        fourCC: this.grandiose.FOURCC_BGRX as VideoSendFrame['fourCC'],
        pictureAspectRatio: width / height,
        frameFormatType: this.grandiose
          .FORMAT_TYPE_PROGRESSIVE as VideoSendFrame['frameFormatType'],
        lineStrideBytes: width * 4,
        data: output.frame
      })
      .catch((error: Error) => console.error('NDI frame could not be sent:', error.message))
      .finally(() => {
        output.sending = false
        if (output.hasPendingFrame) this.sendFrame(output)
      })
  }

  private resendStaleFrames(): void {
    const now = Date.now()
    for (const output of Object.values(this.outputs)) {
      if (output && now - output.lastSentAt >= KEEPALIVE_MS) this.sendFrame(output)
    }
  }
}

export const ndiOutput = new NdiOutput()
