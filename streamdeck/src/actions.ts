import type { AppState, PreviewScreen } from './client.ts'
import { appClient } from './client.ts'
import type { GlyphName } from './glyphs.ts'
import { numpad, withDigit } from './numpad.ts'
import { colors, fit, type KeyView } from './render.ts'

export const PLUGIN_UUID = 'com.miagg.dualpresenter'

// Numpad profile shipped with the plugin (profiles/numpad.streamDeckProfile)
export const NUMPAD_PROFILE = 'profiles/numpad'

export type Settings = {
  // Go To Slide: slide number, 1-based
  slide?: string
  // Names page actions: which screen to page
  screen?: 'main' | 'side'
  // Open DualPresenter: app to launch instead of the installed one
  appPath?: string
  // Screen preview keys: stretch the preview to fill the key below the label (on unless turned off)
  previewFill?: boolean
  // Keys showing a title or file name: scroll it when it is too long to fit (on unless turned off)
  scrollTitle?: boolean
  // Numpad digit key: which digit, assigned automatically when the key is added
  digit?: string
}

// Pictures used on keys, loaded by the plugin at startup (data URLs)
export const images = { app: '' }

// A command for the app: action name and parameters. Names starting with "@" are handled by the
// plugin itself: "@numpad-toggle" and "@numpad-close" open and close the numpad profile.
export type Command = [string, Record<string, unknown>?]

export interface KeyDefinition {
  id: string
  name: string
  tooltip: string
  icon: GlyphName
  // Property inspector file in ui/, for actions with settings
  inspector?: string
  // Shows "NO FILE" while no Excel file is open
  needsFile?: boolean
  view: (state: AppState, settings: Settings) => KeyView
  press?: (state: AppState, settings: Settings) => Command | null
  // Shown while the app isn't running, instead of "APP OFFLINE"; pressing it then launches the app
  launcher?: (launching: boolean) => KeyView
  // Picture for the key in the Stream Deck app, instead of the icon
  keyImage?: string
}

export interface DialView {
  title: string
  value: string
  // 0..100
  indicator: number
  icon: GlyphName
  iconColor: string
}

export interface DialDefinition {
  id: string
  name: string
  tooltip: string
  icon: GlyphName
  triggers: { Rotate: string; Push: string; Touch: string }
  needsFile?: boolean
  view: (state: AppState) => DialView
  rotate: (state: AppState, ticks: number) => Command | null
  push: (state: AppState) => Command | null
  touch: (state: AppState) => Command | null
}

// Red frame on a key whose slide is the one held on the screens, like the slide list in the app
const frozenFrame = (s: AppState, index: number): string | undefined =>
  s.freeze && s.frozenSlideIndex === index ? colors.red : undefined

const slideNumber = (s: AppState): string => `${s.slide.index + 1}/${s.slide.count}`

const audio = (s: AppState): { active: boolean; position: number; total: number } => {
  const a = s.audibleNames
  const active = a.isPlaying || a.isPaused
  return {
    active,
    position: Math.min(a.currentIndex + 1, a.totalNames),
    total: a.totalNames
  }
}

const screenName = (settings: Settings): 'main' | 'side' =>
  settings.screen === 'side' ? 'side' : 'main'

const pageView = (s: AppState, settings: Settings, direction: 1 | -1): KeyView => {
  const screen = screenName(settings)
  const { page, total } = s.pages[screen]
  const label = `${screen === 'main' ? 'Main' : 'Side'} page`
  const icon: GlyphName = direction > 0 ? 'pageNext' : 'pagePrev'

  if (total <= 1) {
    return { label, icon, detail: total === 1 ? 'ONE PAGE' : 'NO NAMES', disabled: true }
  }

  const atEdge = direction > 0 ? page >= total - 1 : page <= 0
  return {
    label,
    value: `${page + 1}/${total}`,
    detail: atEdge
      ? direction > 0
        ? 'LAST PAGE'
        : 'FIRST PAGE'
      : direction > 0
        ? 'NEXT ›'
        : '‹ PREV',
    progress: (page + 1) / total,
    background: atEdge ? undefined : colors.teal
  }
}

const nameStepView = (s: AppState, direction: 1 | -1): KeyView => {
  const label = direction > 0 ? 'Next name' : 'Prev name'
  const icon: GlyphName = direction > 0 ? 'skipNext' : 'skipPrev'
  const { active, position, total } = audio(s)

  if (!s.audibleNames.enabled) return { label, icon, detail: 'AUDIO OFF', disabled: true }
  if (!active) return { label, icon, detail: 'NOT PLAYING', disabled: true }
  return { label, icon, detail: `${position} / ${total}`, progress: position / total }
}

// Main or side screen preview, as captured from the app's preview panels
const previewView = (s: AppState, screen: PreviewScreen, settings: Settings): KeyView => {
  const label = screen === 'main' ? 'Main screen' : 'Side screen'
  const preview = appClient.previews[screen]
  if (!preview) return { label, icon: 'monitor', detail: 'LOADING' }

  // Card type, with the names page when there is more than one
  const { page, total, type } = s.pages[screen]
  const status = [type?.toUpperCase(), total > 1 ? `${page + 1}/${total}` : null]
    .filter(Boolean)
    .join(' · ')
  return {
    label,
    preview: preview.image,
    previewAspect: preview.width / preview.height,
    // The preview is the app's view; the screens themselves may be black
    detail: s.blackOut ? 'BLACK OUT' : status,
    previewFill: settings.previewFill !== false,
    labelBackground: screen === 'main' ? frozenFrame(s, s.slide.index) : undefined
  }
}

export const keys: KeyDefinition[] = [
  {
    id: 'preview-main',
    name: 'Main Screen Preview',
    tooltip:
      'Shows the main screen as previewed in DualPresenter. Updated only when it changes, and only captured while this key is on the deck.',
    inspector: 'preview.html',
    icon: 'monitor',
    needsFile: true,
    view: (s, settings) => previewView(s, 'main', settings)
  },
  {
    id: 'preview-side',
    name: 'Side Screen Preview',
    tooltip:
      'Shows the side screen as previewed in DualPresenter. Updated only when it changes, and only captured while this key is on the deck.',
    inspector: 'preview.html',
    icon: 'monitor',
    needsFile: true,
    view: (s, settings) => previewView(s, 'side', settings)
  },
  {
    id: 'open-app',
    name: 'Open DualPresenter',
    tooltip: 'Open DualPresenter, or bring it to the front if it is already open.',
    icon: 'launch',
    inspector: 'open-app.html',
    keyImage: 'imgs/actions/open-app/app',
    view: () => ({
      label: 'DualPresenter',
      image: images.app,
      detail: 'RUNNING',
      status: colors.green
    }),
    press: () => ['focus-app'],
    launcher: (launching) => ({
      label: 'DualPresenter',
      image: images.app,
      detail: launching ? 'STARTING…' : 'OPEN',
      status: launching ? colors.amber : colors.disabled,
      disabled: !launching
    })
  },
  {
    id: 'blackout',
    name: 'Black Out',
    tooltip: 'Black out both screens. Red while the screens are black.',
    icon: 'blackout',
    view: (s) =>
      s.blackOut
        ? { label: 'Black out', icon: 'blackout', detail: 'SCREENS BLACK', background: colors.red }
        : { label: 'Black out', icon: 'monitor', detail: 'LIVE' },
    press: () => ['toggle-black-out']
  },
  {
    id: 'freeze',
    name: 'Freeze Output',
    tooltip: 'Keep the screens on the current slide while you move around. Red while frozen.',
    icon: 'freeze',
    needsFile: true,
    view: (s) =>
      s.freeze
        ? {
            label: 'Freeze',
            icon: 'freeze',
            detail: s.frozenSlideIndex !== null ? `HOLDING ${s.frozenSlideIndex + 1}` : 'FROZEN',
            background: colors.red
          }
        : { label: 'Freeze', icon: 'freeze', detail: 'LIVE' },
    press: () => ['toggle-freeze']
  },
  {
    id: 'current-slide',
    name: 'Current Slide',
    tooltip:
      'Shows the selected slide, its title and how far into the show you are. Framed red when it is the frozen slide. Turns red while the screens are blacked out or frozen. Press to type a slide number to jump to.',
    icon: 'slides',
    needsFile: true,
    inspector: 'scroll-text.html',
    view: (s, settings) => {
      // Black out and freeze change what the audience sees, so this key shows them even when
      // their own keys aren't on the page
      const frozen = s.freeze && s.frozenSlideIndex !== null
      const alert = s.blackOut || frozen
      const label =
        s.blackOut && frozen
          ? 'Black · Frozen'
          : s.blackOut
            ? 'Black out'
            : frozen
              ? `Frozen ${s.frozenSlideIndex! + 1}`
              : (s.slide.type ?? 'Slide')
      // On the red background, the frozen-slide frame is drawn darker so it stays visible
      const frame = frozenFrame(s, s.slide.index)
      return {
        label,
        // Long captions (e.g. "BLACK · FROZEN") need a smaller size to fit across the key
        labelSize: label.length > 11 ? 16 : 20,
        value: slideNumber(s),
        detail: s.slide.title ?? '',
        scrollDetail: settings.scrollTitle !== false,
        progress: (s.slide.index + 1) / s.slide.count,
        background: alert ? colors.red : undefined,
        outline: frame && alert ? '#7f1d1d' : frame
      }
    },
    press: () => {
      numpad.set('')
      return ['@numpad-toggle']
    }
  },
  {
    id: 'frozen-slide',
    name: 'Frozen Slide',
    tooltip:
      'While the output is frozen, shows the slide held on the screens. Press to go back to it.',
    icon: 'freeze',
    needsFile: true,
    view: (s) => {
      const index = s.frozenSlideIndex
      if (!s.freeze || index === null) {
        return { label: 'Frozen slide', icon: 'freeze', detail: 'NOT FROZEN', disabled: true }
      }
      const here = s.slide.index === index
      return {
        label: here ? 'Frozen · here' : 'Back to frozen',
        value: String(index + 1),
        detail: s.slide.titles[index] ?? '',
        outline: colors.red,
        background: here ? undefined : '#7f1d1d'
      }
    },
    press: (s) =>
      s.freeze && s.frozenSlideIndex !== null ? ['goto-slide', { index: s.frozenSlideIndex }] : null
  },
  {
    id: 'next-slide',
    name: 'Next Slide',
    tooltip: 'Go to the next slide. Shows its number and title.',
    icon: 'next',
    inspector: 'scroll-text.html',
    needsFile: true,
    view: (s, settings) =>
      s.slide.index < s.slide.count - 1
        ? {
            label: `Next ${s.slide.index + 2}/${s.slide.count}`,
            icon: 'next',
            detail: s.slide.nextTitle ?? '',
            scrollDetail: settings.scrollTitle !== false,
            outline: frozenFrame(s, s.slide.index + 1)
          }
        : { label: 'Next', icon: 'next', detail: 'END OF SHOW', disabled: true },
    press: () => ['next-slide']
  },
  {
    id: 'prev-slide',
    name: 'Previous Slide',
    tooltip: 'Go to the previous slide. Shows its number and title.',
    icon: 'prev',
    inspector: 'scroll-text.html',
    needsFile: true,
    view: (s, settings) =>
      s.slide.index > 0
        ? {
            label: `Prev ${s.slide.index}/${s.slide.count}`,
            icon: 'prev',
            detail: s.slide.previousTitle ?? '',
            scrollDetail: settings.scrollTitle !== false,
            outline: frozenFrame(s, s.slide.index - 1)
          }
        : { label: 'Prev', icon: 'prev', detail: 'FIRST SLIDE', disabled: true },
    press: () => ['prev-slide']
  },
  {
    id: 'goto-slide',
    name: 'Go To Slide',
    tooltip: 'Jump straight to a chosen slide. Green while that slide is on screen.',
    icon: 'goto',
    inspector: 'goto-slide.html',
    needsFile: true,
    view: (s, settings) => {
      const number = parseInt(settings.slide ?? '', 10)
      if (!(number >= 1 && number <= s.slide.count)) {
        return { label: 'Go to', icon: 'goto', detail: 'PICK SLIDE', disabled: true }
      }
      const current = s.slide.index === number - 1
      return {
        label: current ? 'On screen' : `Go to ${number}`,
        value: String(number),
        detail: s.slide.titles[number - 1] ?? '',
        background: current ? colors.green : undefined,
        outline: frozenFrame(s, number - 1)
      }
    },
    press: (s, settings) => {
      const number = parseInt(settings.slide ?? '', 10)
      return number >= 1 && number <= s.slide.count ? ['goto-slide', { index: number - 1 }] : null
    }
  },
  {
    id: 'numpad-open',
    name: 'Open Numpad',
    tooltip:
      'Open the numpad page to type a slide number to jump to. Looks like the "Go to slide" folder icon.',
    icon: 'numpad',
    needsFile: true,
    view: () => ({ label: 'Go to slide', icon: 'numpad' }),
    press: () => {
      numpad.set('')
      return ['@numpad-toggle']
    }
  },
  {
    id: 'numpad-digit',
    name: 'Numpad Digit',
    tooltip:
      'Type a slide number to jump to with the Numpad Go key. Each digit key you add gets the next digit; change it in the key settings.',
    icon: 'numpad',
    inspector: 'numpad-digit.html',
    needsFile: true,
    view: (s, settings) => {
      const digit = settings.digit ?? ''
      const next = withDigit(digit, s.slide.count)
      const number = parseInt(next, 10)
      const valid = number >= 1 && number <= s.slide.count
      return {
        label: numpad.value ? `Typed ${numpad.value}` : 'Slide no.',
        value: digit || '?',
        detail: valid ? `→ ${number}` : '—',
        disabled: !valid
      }
    },
    press: (s, settings) => {
      const next = withDigit(settings.digit ?? '', s.slide.count)
      const number = parseInt(next, 10)
      if (number >= 1 && number <= s.slide.count) numpad.set(next)
      return null
    }
  },
  {
    id: 'numpad-go',
    name: 'Numpad Go',
    tooltip: 'Shows the slide number typed on the numpad and its title. Press to jump to it.',
    icon: 'numpad',
    needsFile: true,
    view: (s) => {
      const number = parseInt(numpad.value, 10)
      if (!numpad.value) return { label: 'Go to slide', icon: 'numpad', detail: 'TYPE NUMBER' }
      if (!(number >= 1 && number <= s.slide.count)) {
        return {
          label: 'Go to slide',
          value: numpad.value,
          detail: 'NO SUCH SLIDE',
          background: '#7f1d1d'
        }
      }
      return {
        label: `Go to ${number}`,
        value: String(number),
        detail: s.slide.titles[number - 1] ?? '',
        background: colors.green,
        outline: frozenFrame(s, number - 1)
      }
    },
    press: (s) => {
      const number = parseInt(numpad.value, 10)
      if (!(number >= 1 && number <= s.slide.count)) return null
      numpad.set('')
      return ['goto-slide', { index: number - 1 }]
    }
  },
  {
    id: 'numpad-close',
    name: 'Numpad Back',
    tooltip: 'Leave the numpad without jumping. Used on the numpad page opened by Current Slide.',
    icon: 'prev',
    view: () => ({ label: 'Back', icon: 'prev', detail: numpad.value ? 'CANCEL' : undefined }),
    press: () => {
      numpad.set('')
      return ['@numpad-close']
    }
  },
  {
    id: 'numpad-delete',
    name: 'Numpad Delete',
    tooltip: 'Remove the last digit typed on the numpad.',
    icon: 'backspace',
    needsFile: true,
    view: () =>
      numpad.value
        ? { label: 'Delete', icon: 'backspace', detail: numpad.value }
        : { label: 'Delete', icon: 'backspace', detail: 'EMPTY', disabled: true },
    press: () => {
      numpad.set(numpad.value.slice(0, -1))
      return null
    }
  },
  {
    id: 'flip-screens',
    name: 'Flip Screens',
    tooltip: 'Swap the main and side screens.',
    icon: 'flip',
    view: (s) =>
      s.screens.main || s.screens.side
        ? {
            label: 'Flip screens',
            icon: 'flip',
            detail: s.screens.main && s.screens.side ? 'MAIN ⇄ SIDE' : 'ONE SCREEN'
          }
        : { label: 'Flip screens', icon: 'flip', detail: 'NO SCREENS', disabled: true },
    press: () => ['flip-screens']
  },
  {
    id: 'play-names',
    name: 'Play / Stop Names',
    tooltip:
      'Read out the names on the current slide. Shows progress, the name being read and its position, e.g. 3/12. Turns red on the last name of a Side Only names card.',
    icon: 'play',
    inspector: 'scroll-text.html',
    needsFile: true,
    view: (s, settings) => {
      const a = s.audibleNames
      const { active, position, total } = audio(s)
      if (!a.enabled)
        return { label: 'Play names', icon: 'play', detail: 'AUDIO OFF', disabled: true }
      if (active && a.lastName) {
        return {
          label: a.isPaused ? 'Last · paused' : 'Last name',
          value: `${position}/${total}`,
          detail: a.currentName ?? '',
          scrollDetail: settings.scrollTitle !== false,
          progress: 1,
          background: colors.red,
          pulse: !a.isPaused
        }
      }
      if (active) {
        return {
          label: a.isPaused ? 'Paused' : 'Playing',
          value: `${position}/${total}`,
          detail: a.currentName ?? '',
          scrollDetail: settings.scrollTitle !== false,
          progress: total > 0 ? position / total : 0,
          background: a.isPaused ? colors.amber : colors.green,
          pulse: !a.isPaused
        }
      }
      if (!a.available)
        return { label: 'Play names', icon: 'play', detail: 'NO NAMES', disabled: true }
      return {
        label: 'Play names',
        icon: 'play',
        detail: a.autoPlayback ? 'READY · AUTO' : 'READY'
      }
    },
    press: () => ['toggle-audio-playback']
  },
  {
    id: 'stop-names',
    name: 'Stop Names',
    tooltip: 'Stop reading out names.',
    icon: 'stop',
    view: (s) => {
      const { active, position, total } = audio(s)
      return active
        ? {
            label: 'Stop names',
            icon: 'stop',
            detail: `${position} / ${total}`,
            background: colors.red
          }
        : { label: 'Stop names', icon: 'stop', detail: 'NOT PLAYING', disabled: true }
    },
    press: () => ['stop-audio']
  },
  {
    id: 'next-name',
    name: 'Next Name',
    tooltip: 'Skip to the next name while names are being read out.',
    icon: 'skipNext',
    view: (s) => nameStepView(s, 1),
    press: () => ['next-name']
  },
  {
    id: 'prev-name',
    name: 'Previous Name',
    tooltip: 'Go back to the previous name while names are being read out.',
    icon: 'skipPrev',
    view: (s) => nameStepView(s, -1),
    press: () => ['prev-name']
  },
  {
    id: 'audible-names',
    name: 'Audible Names On/Off',
    tooltip: 'Turn reading names out loud on or off.',
    icon: 'speaker',
    view: (s) =>
      s.audibleNames.enabled
        ? { label: 'Audible names', icon: 'speaker', detail: 'ON', background: colors.purple }
        : { label: 'Audible names', icon: 'speakerOff', detail: 'OFF' },
    press: () => ['toggle-audible-names']
  },
  {
    id: 'auto-playback',
    name: 'Auto Playback On/Off',
    tooltip: 'Start reading names automatically when a names slide comes up.',
    icon: 'auto',
    view: (s) =>
      s.audibleNames.autoPlayback
        ? {
            label: 'Auto playback',
            icon: 'auto',
            detail: s.audibleNames.enabled ? 'ON' : 'ON · AUDIO OFF',
            background: colors.teal
          }
        : { label: 'Auto playback', icon: 'auto', detail: 'OFF' },
    press: () => ['toggle-auto-playback']
  },
  {
    id: 'transitions',
    name: 'Slide Transitions On/Off',
    tooltip: 'Turn the transition between slides on or off. Shows the transition duration.',
    icon: 'transition',
    view: (s) =>
      s.transitions.enabled
        ? {
            label: 'Transitions',
            icon: 'transition',
            detail: `ON · ${s.transitions.duration} MS`,
            background: colors.blue
          }
        : { label: 'Transitions', icon: 'transition', detail: 'OFF' },
    press: () => ['toggle-transitions']
  },
  {
    id: 'ndi',
    name: 'NDI Output On/Off',
    tooltip: 'Turn sending the main and side screens over NDI on or off. Shows the frame rate.',
    icon: 'ndi',
    view: (s) =>
      s.ndi?.enabled
        ? {
            label: 'NDI output',
            icon: 'ndi',
            detail: `ON · ${s.ndi.frameRate} FPS`,
            background: colors.green
          }
        : { label: 'NDI output', icon: 'ndi', detail: 'OFF' },
    press: () => ['toggle-ndi']
  },
  {
    id: 'continuous-playback',
    name: 'Continuous Playback On/Off',
    tooltip: 'On: names are read one after another. Off: one name per press, step by step.',
    icon: 'loop',
    view: (s) =>
      s.audibleNames.continuousPlayback
        ? { label: 'Continuous', icon: 'loop', detail: 'ON', background: '#0891b2' }
        : { label: 'Continuous', icon: 'loop', detail: 'OFF · STEP' },
    press: () => ['toggle-continuous-playback']
  },
  {
    id: 'next-page',
    name: 'Next Names Page',
    tooltip: 'Show the next page of names on the main or side screen. Shows the page, e.g. 2/3.',
    icon: 'pageNext',
    inspector: 'names-page.html',
    needsFile: true,
    view: (s, settings) => pageView(s, settings, 1),
    press: (_, settings) => ['next-page', { screen: screenName(settings) }]
  },
  {
    id: 'prev-page',
    name: 'Previous Names Page',
    tooltip: 'Show the previous page of names on the main or side screen.',
    icon: 'pagePrev',
    inspector: 'names-page.html',
    needsFile: true,
    view: (s, settings) => pageView(s, settings, -1),
    press: (_, settings) => ['prev-page', { screen: screenName(settings) }]
  },
  {
    id: 'precedence-up',
    name: 'Names Precedence +',
    tooltip: 'Show names on the side screen one slide earlier. Shows the current precedence.',
    icon: 'plus',
    view: (s) => ({ label: 'Precedence', value: String(s.namesPrecedence), detail: '+ EARLIER' }),
    press: () => ['precedence-up']
  },
  {
    id: 'precedence-down',
    name: 'Names Precedence −',
    tooltip: 'Show names on the side screen one slide later. Shows the current precedence.',
    icon: 'minus',
    view: (s) =>
      s.namesPrecedence > 0
        ? { label: 'Precedence', value: String(s.namesPrecedence), detail: '− LATER' }
        : { label: 'Precedence', value: '0', detail: 'MINIMUM', disabled: true },
    press: () => ['precedence-down']
  },
  {
    id: 'open-excel',
    name: 'Open Excel File',
    tooltip: 'Choose an Excel file to open in DualPresenter. Shows the file that is open.',
    inspector: 'scroll-text.html',
    icon: 'folder',
    view: (s, settings) => ({
      label: 'Open Excel',
      icon: 'folder',
      detail: s.excelLoaded ? s.fileName : 'NO FILE',
      scrollDetail: settings.scrollTitle !== false
    }),
    press: () => ['open-excel']
  },
  {
    id: 'close-excel',
    name: 'Close Excel File',
    tooltip: 'Close the open Excel file. Asks first while the main screen is on.',
    icon: 'close',
    inspector: 'scroll-text.html',
    needsFile: true,
    view: (s, settings) => ({
      label: 'Close Excel',
      icon: 'close',
      detail: s.fileName,
      scrollDetail: settings.scrollTitle !== false
    }),
    press: () => ['close-excel']
  },
  {
    id: 'search',
    name: 'Search',
    tooltip:
      'Open the slide search in DualPresenter, ready to type, or close it. Highlighted while search is open.',
    icon: 'search',
    needsFile: true,
    view: (s) =>
      s.searchOpen
        ? { label: 'Search', icon: 'search', detail: 'OPEN', background: colors.blue }
        : { label: 'Search', icon: 'search' },
    press: () => ['toggle-search']
  },
  {
    id: 'settings',
    name: 'Settings',
    tooltip: 'Open the DualPresenter settings. Highlighted while the settings window is open.',
    icon: 'gear',
    view: (s) =>
      s.settingsOpen
        ? { label: 'Settings', icon: 'gear', detail: 'OPEN', background: colors.blue }
        : { label: 'Settings', icon: 'gear' },
    press: () => ['open-settings']
  },
  {
    id: 'edit-excel',
    name: 'Edit Excel File',
    tooltip: 'Open the Excel file in Excel. Shows which file is open.',
    icon: 'edit',
    inspector: 'scroll-text.html',
    needsFile: true,
    view: (s, settings) => ({
      label: 'Edit Excel',
      icon: 'edit',
      detail: s.fileName,
      scrollDetail: settings.scrollTitle !== false
    }),
    press: () => ['edit-excel']
  },
  {
    id: 'reload',
    name: 'Reload Data',
    tooltip: 'Reload the Excel file. Shows which file is open.',
    icon: 'reload',
    inspector: 'scroll-text.html',
    needsFile: true,
    view: (s, settings) => ({
      label: 'Reload',
      icon: 'reload',
      detail: s.fileName,
      scrollDetail: settings.scrollTitle !== false
    }),
    press: () => ['reload-data']
  }
]

const clampSlide = (s: AppState, index: number): number =>
  Math.min(Math.max(index, 0), s.slide.count - 1)

export const dials: DialDefinition[] = [
  {
    id: 'slide-dial',
    name: 'Slide Dial',
    tooltip: 'Turn to move through slides, press to black out, touch to freeze.',
    icon: 'dial',
    triggers: { Rotate: 'Change slide', Push: 'Black out', Touch: 'Freeze' },
    needsFile: true,
    view: (s) => ({
      title: `Slide ${slideNumber(s)}${s.blackOut ? ' · BLACK' : s.freeze && s.frozenSlideIndex !== null ? ` · FROZEN ${s.frozenSlideIndex + 1}` : ''}`,
      value: fit(s.slide.title ?? '', 18),
      indicator: Math.round(((s.slide.index + 1) / s.slide.count) * 100),
      icon: s.blackOut ? 'blackout' : s.freeze ? 'freeze' : 'slides',
      iconColor: s.blackOut || s.freeze ? '#f87171' : colors.text
    }),
    rotate: (s, ticks) => {
      const target = clampSlide(s, s.slide.index + ticks)
      return target === s.slide.index ? null : ['goto-slide', { index: target }]
    },
    push: () => ['toggle-black-out'],
    touch: () => ['toggle-freeze']
  },
  {
    id: 'names-dial',
    name: 'Names Dial',
    tooltip: 'Press to play or stop names, turn to skip between names.',
    icon: 'speaker',
    triggers: { Rotate: 'Previous / next name', Push: 'Play / stop', Touch: 'Play / stop' },
    needsFile: true,
    view: (s) => {
      const a = s.audibleNames
      const { active, position, total } = audio(s)
      if (!a.enabled) {
        return {
          title: 'Names',
          value: 'Audio off',
          indicator: 0,
          icon: 'speakerOff',
          iconColor: colors.muted
        }
      }
      if (!active) {
        return {
          title: 'Names',
          value: a.available ? 'Ready' : 'No names',
          indicator: 0,
          icon: 'play',
          iconColor: a.available ? colors.text : colors.muted
        }
      }
      return {
        title: `${a.lastName ? 'Last name' : a.isPaused ? 'Paused' : 'Playing'} ${position}/${total}`,
        value: fit(a.currentName ?? '', 18),
        indicator: total > 0 ? Math.round((position / total) * 100) : 0,
        icon: a.isPaused ? 'pause' : 'speaker',
        iconColor: a.lastName ? colors.red : a.isPaused ? colors.amber : '#4ade80'
      }
    },
    rotate: (_, ticks) => [ticks > 0 ? 'next-name' : 'prev-name'],
    push: () => ['toggle-audio-playback'],
    touch: () => ['toggle-audio-playback']
  }
]
