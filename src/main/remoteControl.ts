import http from 'http'

// Local control API used by the Stream Deck plugin (see /streamdeck). It only listens on the
// loopback interface and refuses requests coming from web pages, so nothing outside this
// machine - and no website open in a browser on it - can drive the presentation.
//
//   GET  /state   current state snapshot as JSON
//   GET  /events  Server-Sent Events stream; a snapshot is pushed whenever the state changes, and
//                 a "preview" event with a screen preview image whenever that image changes
//   POST /action  {"action": "<name>", ...params} runs one of the registered actions
export const REMOTE_CONTROL_PORT = Number(process.env['DUALPRESENTER_REMOTE_PORT']) || 47321

export type RemoteActionHandler = (params: Record<string, unknown>) => void

export interface RemoteControl {
  // Push the current state to connected clients, if it changed since the last push
  notify: () => void
  // Push a screen preview image (data URL) and its size in pixels, if it differs from the last
  // one sent for that screen
  sendPreview: (screen: string, image: string, size: { width: number; height: number }) => void
  close: () => void
}

const MAX_BODY_SIZE = 16 * 1024

export function startRemoteControl(
  getState: () => unknown,
  actions: Record<string, RemoteActionHandler>,
  // Called when the last client disconnects, so work done for clients can stop
  onAllClientsGone: () => void = () => undefined
): RemoteControl {
  const clients = new Set<http.ServerResponse>()
  let lastPayload = ''
  // Latest preview message of each screen, also sent to clients that connect later
  const previews = new Map<string, { image: string; message: string }>()

  const sendPreview = (
    screen: string,
    image: string,
    size: { width: number; height: number }
  ): void => {
    if (previews.get(screen)?.image === image) return
    const message = `event: preview\ndata: ${JSON.stringify({ screen, image, ...size })}\n\n`
    previews.set(screen, { image, message })
    for (const client of clients) client.write(message)
  }

  const sendJson = (res: http.ServerResponse, status: number, body: unknown): void => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify(body))
  }

  const notify = (): void => {
    const payload = JSON.stringify(getState())
    if (payload === lastPayload) return
    lastPayload = payload
    for (const client of clients) {
      client.write(`data: ${payload}\n\n`)
    }
  }

  const runAction = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    // Browsers can only send a JSON body cross-origin after a CORS preflight, which we never
    // answer, so requiring it keeps web pages from firing actions with a simple form post
    if (!req.headers['content-type']?.startsWith('application/json')) {
      sendJson(res, 415, { ok: false, error: 'Expected a JSON body' })
      return
    }

    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => {
      body += chunk
      if (body.length > MAX_BODY_SIZE) {
        sendJson(res, 413, { ok: false, error: 'Body too large' })
        req.destroy()
      }
    })
    req.on('end', () => {
      if (res.writableEnded) return

      let params: Record<string, unknown>
      try {
        params = JSON.parse(body || '{}')
      } catch {
        sendJson(res, 400, { ok: false, error: 'Invalid JSON' })
        return
      }

      const name = typeof params.action === 'string' ? params.action : ''
      const handler = Object.prototype.hasOwnProperty.call(actions, name) ? actions[name] : null
      if (!handler) {
        sendJson(res, 404, { ok: false, error: `Unknown action: ${name}` })
        return
      }

      try {
        handler(params)
        notify()
        sendJson(res, 200, { ok: true })
      } catch (error) {
        console.error(`Remote action "${name}" failed:`, error)
        sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Error' })
      }
    })
  }

  const server = http.createServer((req, res) => {
    // Requests made by web pages always carry an Origin header; the Stream Deck plugin's don't
    if (req.headers.origin) {
      sendJson(res, 403, { ok: false, error: 'Forbidden' })
      return
    }

    const url = (req.url || '/').split('?')[0]

    if (req.method === 'GET' && url === '/state') {
      sendJson(res, 200, getState())
    } else if (req.method === 'GET' && url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        Connection: 'keep-alive'
      })
      res.write(`data: ${JSON.stringify(getState())}\n\n`)
      for (const { message } of previews.values()) res.write(message)
      clients.add(res)
      req.on('close', () => {
        clients.delete(res)
        if (clients.size === 0) onAllClientsGone()
      })
    } else if (req.method === 'POST' && url === '/action') {
      runAction(req, res)
    } else {
      sendJson(res, 404, { ok: false, error: 'Not found' })
    }
  })

  let closed = false
  let retryTimer: NodeJS.Timeout | null = null
  const listen = (): void => {
    server.listen(REMOTE_CONTROL_PORT, '127.0.0.1')
  }
  server.on('error', (error: NodeJS.ErrnoException) => {
    // A previous instance that is still shutting down can hold the port for a moment, so keep
    // trying instead of leaving the Stream Deck without a connection
    if (error.code === 'EADDRINUSE' && !closed) {
      if (!retryTimer) console.warn(`Port ${REMOTE_CONTROL_PORT} is in use, retrying`)
      retryTimer = setTimeout(listen, 1000)
      return
    }
    console.error(`Remote control server could not start on port ${REMOTE_CONTROL_PORT}:`, error)
  })
  listen()

  // Some state changes (application menu items, audio progress) don't pass through a single
  // place we can hook, so also check for changes periodically. Unchanged state isn't resent.
  const pollInterval = setInterval(notify, 250)
  // Keep idle connections from being dropped
  const heartbeatInterval = setInterval(() => {
    for (const client of clients) client.write(': ping\n\n')
  }, 15000)

  return {
    notify,
    sendPreview,
    close: () => {
      closed = true
      if (retryTimer) clearTimeout(retryTimer)
      clearInterval(pollInterval)
      clearInterval(heartbeatInterval)
      for (const client of clients) client.end()
      clients.clear()
      server.close()
    }
  }
}
