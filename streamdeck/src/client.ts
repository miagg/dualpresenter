import http from 'node:http'

// Connection to DualPresenter's local control API (src/main/remoteControl.ts in the app)

export const APP_PORT = Number(process.env['DUALPRESENTER_REMOTE_PORT']) || 47321
const RECONNECT_DELAY = 1500
// The app sends a heartbeat every 15 s; a connection silent for longer than this is dead
const STALE_CONNECTION_TIMEOUT = 40000

export interface PageInfo {
  page: number
  total: number
  // Type of the card the screen shows
  type: string | null
}

export interface AppState {
  app: string
  version: string
  excelLoaded: boolean
  fileName: string
  slide: {
    index: number
    count: number
    type: string | null
    title: string | null
    subtitle: string | null
    previousTitle: string | null
    nextTitle: string | null
    titles: (string | null)[]
  }
  blackOut: boolean
  freeze: boolean
  frozenSlideIndex: number | null
  settingsOpen: boolean
  searchOpen: boolean
  transitions: { enabled: boolean; duration: number }
  // Missing when the app is older than the NDI output
  ndi?: { enabled: boolean; frameRate: number }
  screens: { main: boolean; side: boolean }
  audibleNames: {
    enabled: boolean
    autoPlayback: boolean
    continuousPlayback: boolean
    available: boolean
    // Last name of a Side Only names card is being read
    lastName: boolean
    isPlaying: boolean
    isPaused: boolean
    currentIndex: number
    totalNames: number
    currentName: string | null
  }
  namesPrecedence: number
  pages: { main: PageInfo; side: PageInfo }
}

type Listener = (state: AppState | null) => void

export type PreviewScreen = 'main' | 'side'

// Screen preview image (data URL) and its size in pixels
export interface Preview {
  image: string
  width: number
  height: number
}

class AppClient {
  // null while DualPresenter isn't running
  state: AppState | null = null
  // Latest preview image (data URL) of each screen, sent by the app when it changes
  previews: Partial<Record<PreviewScreen, Preview>> = {}
  private listeners = new Set<Listener>()
  private previewListeners = new Set<() => void>()

  onChange(listener: Listener): void {
    this.listeners.add(listener)
  }

  onPreview(listener: () => void): void {
    this.previewListeners.add(listener)
  }

  private setState(state: AppState | null): void {
    if (state === null) this.previews = {}
    if (state === null && this.state === null) return
    this.state = state
    for (const listener of this.listeners) listener(state)
  }

  // Follow the app's event stream, reconnecting whenever it goes away. A connection can end in
  // several ways (closed, reset when the app is killed, or silently dropped), so every one of
  // them leads here, once.
  start(): void {
    let ended = false
    let staleTimer: NodeJS.Timeout | null = null

    const reconnect = (): void => {
      if (ended) return
      ended = true
      if (staleTimer) clearTimeout(staleTimer)
      req.destroy()
      this.setState(null)
      setTimeout(() => this.start(), RECONNECT_DELAY)
    }

    const resetStaleTimer = (): void => {
      if (staleTimer) clearTimeout(staleTimer)
      staleTimer = setTimeout(reconnect, STALE_CONNECTION_TIMEOUT)
    }

    const req = http.get({ host: '127.0.0.1', port: APP_PORT, path: '/events' }, (res) => {
      if (res.statusCode !== 200) {
        res.resume()
        reconnect()
        return
      }

      resetStaleTimer()
      let buffer = ''
      res.setEncoding('utf8')
      res.on('data', (chunk: string) => {
        resetStaleTimer()
        buffer += chunk
        let end: number
        while ((end = buffer.indexOf('\n\n')) !== -1) {
          const message = buffer.slice(0, end)
          buffer = buffer.slice(end + 2)
          const lines = message.split('\n')
          const event = lines.find((line) => line.startsWith('event: '))?.slice(7)
          const data = lines
            .filter((line) => line.startsWith('data: '))
            .map((line) => line.slice(6))
            .join('\n')
          if (!data) continue
          try {
            if (event === 'preview') {
              const { screen, ...preview } = JSON.parse(data) as Preview & {
                screen: PreviewScreen
              }
              this.previews[screen] = preview
              for (const listener of this.previewListeners) listener()
            } else {
              this.setState(JSON.parse(data))
            }
          } catch {
            // Ignore a malformed message; the next one carries the full state again
          }
        }
      })
      res.on('end', reconnect)
      res.on('close', reconnect)
      res.on('error', reconnect)
    })

    req.on('error', reconnect)
    req.on('close', reconnect)
  }

  // Run an action in the app. Resolves to false when the app isn't reachable or refused it.
  send(action: string, params: Record<string, unknown> = {}): Promise<boolean> {
    return new Promise((resolve) => {
      const body = JSON.stringify({ ...params, action })
      const req = http.request(
        {
          host: '127.0.0.1',
          port: APP_PORT,
          path: '/action',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          },
          timeout: 3000
        },
        (res) => {
          res.resume()
          resolve(res.statusCode === 200)
        }
      )
      req.on('timeout', () => req.destroy())
      req.on('error', () => resolve(false))
      req.end(body)
    })
  }
}

export const appClient = new AppClient()
