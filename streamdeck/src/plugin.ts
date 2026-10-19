import streamDeck, {
  SingletonAction,
  type Action,
  type DialDownEvent,
  type DialRotateEvent,
  type DidReceiveSettingsEvent,
  type KeyDownEvent,
  type SendToPluginEvent,
  type TouchTapEvent,
  type WillAppearEvent,
  type WillDisappearEvent
} from '@elgato/streamdeck'
import type { JsonValue } from '@elgato/utils'
import { execFile, spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { appClient, type AppState } from './client.ts'
import {
  dials,
  images,
  keys,
  NUMPAD_PROFILE,
  PLUGIN_UUID,
  type Command,
  type DialDefinition,
  type KeyDefinition,
  type Settings
} from './actions.ts'
import { numpad } from './numpad.ts'
import { colors, renderGlyph, renderKey, type KeyView } from './render.ts'

const execFileAsync = promisify(execFile)
const APP_BUNDLE_ID = 'com.miagg.dualpresenter'

// Set while DualPresenter is being started from a key, until it connects or gives up
let launching: NodeJS.Timeout | null = null

// Candidate locations of the installed app on Windows
function windowsAppPaths(): string[] {
  const roots = [process.env['LOCALAPPDATA'] && join(process.env['LOCALAPPDATA'], 'Programs')]
  roots.push(process.env['ProgramFiles'], process.env['ProgramFiles(x86)'])
  return roots
    .filter((root): root is string => !!root)
    .flatMap((root) =>
      ['DualPresenter', 'dualpresenter'].map((dir) => join(root, dir, 'DualPresenter.exe'))
    )
}

// Start DualPresenter. A running app is brought to the front through its API instead.
async function launchApp(settings: Settings): Promise<boolean> {
  const custom = settings.appPath?.trim()
  try {
    if (process.platform === 'darwin') {
      // By bundle identifier, so it is found wherever it is installed
      await execFileAsync('open', custom ? [custom] : ['-b', APP_BUNDLE_ID])
    } else {
      const path = [custom, ...windowsAppPaths()].find((p) => p && existsSync(p))
      if (!path) {
        streamDeck.logger.error('DualPresenter.exe not found; set its location in the key settings')
        return false
      }
      spawn(path, [], { detached: true, stdio: 'ignore' }).unref()
    }
  } catch (error) {
    streamDeck.logger.error(`Could not start DualPresenter: ${error}`)
    return false
  }

  if (launching) clearTimeout(launching)
  launching = setTimeout(() => {
    launching = null
    renderAll()
  }, 30000)
  renderAll()
  return true
}

// Pulse animation: keys whose view asks for it are redrawn with a changing background while the
// timer runs. It only runs while at least one such key is showing.
const PULSE_PERIOD = 1400
const PULSE_FRAME = 120
const pulsing = new Set<string>()
let pulseTimer: NodeJS.Timeout | null = null

const pulsePosition = (): number => (1 - Math.cos((2 * Math.PI * Date.now()) / PULSE_PERIOD)) / 2

function updatePulse(): void {
  if (pulsing.size > 0 && !pulseTimer) {
    pulseTimer = setInterval(() => renderAll(), PULSE_FRAME)
  } else if (pulsing.size === 0 && pulseTimer) {
    clearInterval(pulseTimer)
    pulseTimer = null
  }
}

// Last settings and image per action instance, so keys are only redrawn when they change
const settingsById = new Map<string, Settings>()
const imageById = new Map<string, string>()

// The numpad profile is showing on a device when its Back key is visible there
function numpadOpen(deviceId: string): boolean {
  const back = handlers.find((h) => h.manifestId === `${PLUGIN_UUID}.numpad-close`)
  return !!back && [...back.actions].some((a) => a.device.id === deviceId)
}

async function runLocal(name: string, action: Action<Settings>): Promise<void> {
  const deviceId = action.device.id
  if (name === '@numpad-toggle' && !numpadOpen(deviceId)) {
    await streamDeck.profiles.switchToProfile(deviceId, NUMPAD_PROFILE)
  } else if (numpadOpen(deviceId)) {
    // Back to the profile that was showing before
    await streamDeck.profiles.switchToProfile(deviceId)
  }
}

async function run(command: Command | null, action: Action<Settings>): Promise<void> {
  if (!command) return
  if (command[0].startsWith('@')) return runLocal(command[0], action)
  const ok = await appClient.send(command[0], command[1])
  if (!ok && (action.isKey() || action.isDial())) await action.showAlert()
}

// Placeholder shown when the app isn't running or has no file open
function unavailableView(definition: KeyDefinition, state: AppState | null): KeyView | null {
  if (!state && definition.launcher) return definition.launcher(launching !== null)
  if (!state)
    return { label: definition.name, icon: definition.icon, detail: 'APP OFFLINE', disabled: true }
  if (definition.needsFile && !state.excelLoaded) {
    return { label: definition.name, icon: definition.icon, detail: 'NO FILE', disabled: true }
  }
  return null
}

class KeyActionHandler extends SingletonAction<Settings> {
  constructor(private definition: KeyDefinition) {
    super()
    ;(this as { manifestId: string }).manifestId = `${PLUGIN_UUID}.${definition.id}`
  }

  render(action: Action<Settings>): void {
    if (!action.isKey()) return
    const state = appClient.state
    const settings = settingsById.get(action.id) ?? {}
    const view = unavailableView(this.definition, state) ?? this.definition.view(state!, settings)
    if (view.pulse) pulsing.add(action.id)
    else pulsing.delete(action.id)
    updatePulse()
    const image = renderKey(view, pulsePosition())
    if (imageById.get(action.id) === image) return
    imageById.set(action.id, image)
    void action.setImage(image)
  }

  renderAll(): void {
    for (const action of this.actions) this.render(action)
  }

  override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
    let settings = ev.payload.settings
    // A newly added numpad digit takes the next digit not yet on this device: 1…9, then 0
    if (this.definition.id === 'numpad-digit' && !settings.digit) {
      const used = new Set(
        [...this.actions]
          .filter((a) => a.id !== ev.action.id && a.device.id === ev.action.device.id)
          .map((a) => settingsById.get(a.id)?.digit)
      )
      const digit = [...'1234567890'].find((d) => !used.has(d)) ?? '0'
      settings = { ...settings, digit }
      await ev.action.setSettings(settings)
    }
    settingsById.set(ev.action.id, settings)
    imageById.delete(ev.action.id)
    this.render(ev.action)
  }

  override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
    settingsById.delete(ev.action.id)
    imageById.delete(ev.action.id)
    pulsing.delete(ev.action.id)
    updatePulse()
  }

  override onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): void {
    settingsById.set(ev.action.id, ev.payload.settings)
    this.render(ev.action)
  }

  override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
    const state = appClient.state
    if (!state && this.definition.launcher) {
      if (!(await launchApp(ev.payload.settings))) await ev.action.showAlert()
      return
    }
    if (!state || !this.definition.press || unavailableView(this.definition, state)) {
      if (this.definition.press) await ev.action.showAlert()
      return
    }
    const command = this.definition.press(state, ev.payload.settings)
    await run(command, ev.action)
    // Jumping from the numpad page returns to the page it was opened from
    if (command && this.definition.id === 'numpad-go') await runLocal('@numpad-close', ev.action)
  }

  // The Go To Slide inspector asks for the slide list to fill its dropdown
  override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, Settings>): Promise<void> {
    const payload = ev.payload as { event?: string } | null
    if (payload?.event !== 'getSlides') return
    const titles = appClient.state?.slide.titles ?? []
    await streamDeck.ui.sendToPropertyInspector({
      event: 'getSlides',
      items: titles.map((title, i) => ({
        label: `${i + 1} · ${title ?? ''}`,
        value: String(i + 1)
      }))
    })
  }
}

class DialActionHandler extends SingletonAction<Settings> {
  constructor(private definition: DialDefinition) {
    super()
    ;(this as { manifestId: string }).manifestId = `${PLUGIN_UUID}.${definition.id}`
  }

  render(action: Action<Settings>): void {
    if (!action.isDial()) return
    const state = appClient.state
    const available = state && (!this.definition.needsFile || state.excelLoaded)
    const view = available
      ? this.definition.view(state)
      : {
          title: this.definition.name,
          value: state ? 'No file' : 'App offline',
          indicator: 0,
          icon: this.definition.icon,
          iconColor: colors.disabled
        }
    const feedback = {
      title: view.title,
      value: view.value,
      indicator: { value: view.indicator },
      icon: renderGlyph(view.icon, view.iconColor)
    }
    const key = JSON.stringify(feedback)
    if (imageById.get(action.id) === key) return
    imageById.set(action.id, key)
    void action.setFeedback(feedback)
  }

  renderAll(): void {
    for (const action of this.actions) this.render(action)
  }

  private available(): AppState | null {
    const state = appClient.state
    return state && (!this.definition.needsFile || state.excelLoaded) ? state : null
  }

  override onWillAppear(ev: WillAppearEvent<Settings>): void {
    imageById.delete(ev.action.id)
    this.render(ev.action)
  }

  override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
    imageById.delete(ev.action.id)
  }

  override async onDialRotate(ev: DialRotateEvent<Settings>): Promise<void> {
    const state = this.available()
    if (!state) return void (await ev.action.showAlert())
    await run(this.definition.rotate(state, ev.payload.ticks), ev.action)
  }

  override async onDialDown(ev: DialDownEvent<Settings>): Promise<void> {
    const state = this.available()
    if (!state) return void (await ev.action.showAlert())
    await run(this.definition.push(state), ev.action)
  }

  override async onTouchTap(ev: TouchTapEvent<Settings>): Promise<void> {
    const state = this.available()
    if (!state) return void (await ev.action.showAlert())
    await run(this.definition.touch(state), ev.action)
  }
}

images.app = `data:image/png;base64,${readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../imgs/actions/open-app/app@2x.png')
).toString('base64')}`

const handlers = [
  ...keys.map((definition) => new KeyActionHandler(definition)),
  ...dials.map((definition) => new DialActionHandler(definition))
]
for (const handler of handlers) streamDeck.actions.registerAction(handler)

function renderAll(): void {
  for (const handler of handlers) handler.renderAll()
}

appClient.onChange((state) => {
  if (state && launching) {
    clearTimeout(launching)
    launching = null
  }
  renderAll()
})
numpad.onChange(renderAll)
appClient.start()

streamDeck.connect()
