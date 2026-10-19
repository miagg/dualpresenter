// Generates manifest.json and the action icons from src/actions.ts, so the list of actions is
// only defined in one place. Run as part of `npm run build`.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dials, keys, NUMPAD_PROFILE, PLUGIN_UUID } from '../src/actions.ts'
import { glyphSvg } from '../src/glyphs.ts'
import { renderKey } from '../src/render.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sdPlugin = join(root, `${PLUGIN_UUID}.sdPlugin`)
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const write = (path: string, content: string): void => {
  mkdirSync(dirname(join(sdPlugin, path)), { recursive: true })
  writeFileSync(join(sdPlugin, path), content)
}

// Action list icons are monochrome white; key and dial images are the dark key background
for (const action of [...keys, ...dials]) {
  write(`imgs/actions/${action.id}/icon.svg`, glyphSvg(action.icon, 20, '#ffffff'))
  write(`imgs/actions/${action.id}/key.svg`, glyphSvg(action.icon, 72, '#f9fafb', '#1f2937'))
}
for (const dial of dials) {
  write(`imgs/actions/${dial.id}/encoder.svg`, glyphSvg(dial.icon, 72, '#f9fafb', '#1f2937'))
}
write('imgs/plugin/category.svg', glyphSvg('slides', 28, '#ffffff'))

// The app icon, as the plugin icon and on the Open DualPresenter key. Resized with macOS's sips;
// the generated files are committed, so other platforms can build without it.
const appIcon = join(root, '..', 'build', 'icon.png')
if (existsSync(appIcon)) {
  for (const [size, path] of [
    [256, 'imgs/plugin/icon.png'],
    [512, 'imgs/plugin/icon@2x.png'],
    [72, 'imgs/actions/open-app/app.png'],
    [144, 'imgs/actions/open-app/app@2x.png']
  ] as const) {
    const target = join(sdPlugin, path)
    mkdirSync(dirname(target), { recursive: true })
    if (process.platform === 'darwin') {
      execFileSync('sips', ['-z', String(size), String(size), appIcon, '--out', target], {
        stdio: 'ignore'
      })
    }
  }
}

const manifest = {
  $schema: 'https://schemas.elgato.com/streamdeck/plugins/manifest.json',
  UUID: PLUGIN_UUID,
  Name: 'DualPresenter',
  Version: `${pkg.version}.0`,
  Author: 'Angelos Michalopoulos (miagg.com)',
  Description:
    'Control DualPresenter from Stream Deck: slides, black out, freeze, audible names and names pages, with live status on every key.',
  Icon: 'imgs/plugin/icon',
  Category: 'DualPresenter',
  CategoryIcon: 'imgs/plugin/category',
  CodePath: 'bin/plugin.js',
  SDKVersion: 2,
  Software: { MinimumVersion: '7.1' },
  OS: [
    { Platform: 'mac', MinimumVersion: '12' },
    { Platform: 'windows', MinimumVersion: '10' }
  ],
  Nodejs: { Version: '24', Debug: 'enabled' },
  Profiles: [
    // Opened by the Current Slide key; switched back from by the plugin, so not read-only
    { Name: NUMPAD_PROFILE, DeviceType: 0, DontAutoSwitchWhenInstalled: true, Readonly: false }
  ],
  Actions: [
    ...keys.map((key) => ({
      UUID: `${PLUGIN_UUID}.${key.id}`,
      Name: key.name,
      Tooltip: key.tooltip,
      Icon: `imgs/actions/${key.id}/icon`,
      Controllers: ['Keypad'],
      States: [{ Image: key.keyImage ?? `imgs/actions/${key.id}/key`, ShowTitle: false }],
      UserTitleEnabled: false,
      ...(key.inspector ? { PropertyInspectorPath: `ui/${key.inspector}` } : {})
    })),
    ...dials.map((dial) => ({
      UUID: `${PLUGIN_UUID}.${dial.id}`,
      Name: dial.name,
      Tooltip: dial.tooltip,
      Icon: `imgs/actions/${dial.id}/icon`,
      Controllers: ['Encoder'],
      Encoder: {
        layout: '$B1',
        Icon: `imgs/actions/${dial.id}/encoder`,
        TriggerDescription: dial.triggers
      },
      States: [{ Image: `imgs/actions/${dial.id}/key` }]
    }))
  ]
}

write('manifest.json', JSON.stringify(manifest, null, 2) + '\n')

// Numpad profile for the 15-key Stream Deck, in Stream Deck's profile format: a zipped .sdProfile
// folder whose manifest maps "column,row" to the action on that key.
const numpadLayout = [
  ['numpad-close', '7', '8', '9', 'numpad-delete'],
  ['current-slide', '4', '5', '6', 'numpad-go'],
  ['0', '1', '2', '3', 'frozen-slide']
]
const profileActions: Record<string, object> = {}
numpadLayout.forEach((row, y) =>
  row.forEach((key, x) => {
    const digit = /^[0-9]$/.test(key)
    const id = digit ? 'numpad-digit' : key
    profileActions[`${x},${y}`] = {
      Name: keys.find((k) => k.id === id)!.name,
      Settings: digit ? { digit: key } : {},
      State: 0,
      States: [{ Title: '', TitleShow: '' }],
      UUID: `${PLUGIN_UUID}.${id}`
    }
  })
)
const profileTmp = join(root, 'dist', 'numpad-profile')
const profileDir = join(profileTmp, 'C6B0F0D2-5D0E-4C5A-9A51-3E8F6E2A7D10.sdProfile')
mkdirSync(profileDir, { recursive: true })
writeFileSync(
  join(profileDir, 'manifest.json'),
  JSON.stringify({
    Actions: profileActions,
    DeviceModel: '20GAA9901',
    Name: 'DualPresenter Numpad',
    Version: '1.0'
  })
)
const profileFile = join(sdPlugin, `${NUMPAD_PROFILE}.streamDeckProfile`)
mkdirSync(dirname(profileFile), { recursive: true })
if (existsSync(profileFile)) rmSync(profileFile)
execFileSync('zip', ['-q', '-r', '-X', profileFile, '.'], { cwd: profileTmp })
rmSync(profileTmp, { recursive: true })
console.log(`Wrote manifest with ${manifest.Actions.length} actions`)

// Icon pack with icons drawn like the plugin's keys, for Stream Deck's own actions: e.g. a
// folder holding the keys that don't fit on the page. Chosen from the icon library.
const iconPack = join(root, `${PLUGIN_UUID}.sdIconPack`)
const packIcons = [
  { name: 'More', path: 'more.svg', view: { label: 'More', icon: 'more' } },
  {
    name: 'More - Settings',
    path: 'more-settings.svg',
    view: { label: 'More', icon: 'more', detail: 'SETTINGS' }
  },
  { name: 'Back', path: 'back.svg', view: { label: 'Back', icon: 'prev' } },
  { name: 'Go to slide', path: 'goto.svg', view: { label: 'Go to slide', icon: 'numpad' } }
] as const

mkdirSync(join(iconPack, 'icons'), { recursive: true })
for (const icon of packIcons) {
  const svg = decodeURIComponent(renderKey(icon.view).split(',')[1])
  writeFileSync(join(iconPack, 'icons', icon.path), svg)
}
writeFileSync(
  join(iconPack, 'icons.json'),
  JSON.stringify(
    packIcons.map((icon) => ({ path: icon.path, name: icon.name, tags: ['dualpresenter'] })),
    null,
    2
  ) + '\n'
)
writeFileSync(
  join(iconPack, 'manifest.json'),
  JSON.stringify(
    {
      Name: 'DualPresenter',
      Description: 'Icons matching the DualPresenter plugin keys',
      Author: 'Angelos Michalopoulos (miagg.com)',
      URL: 'https://miagg.com',
      Version: pkg.version,
      Icon: 'icon.png',
      Tags: 'dualpresenter',
      StreamdeckID: PLUGIN_UUID
    },
    null,
    2
  ) + '\n'
)
if (existsSync(appIcon) && process.platform === 'darwin') {
  execFileSync('sips', ['-z', '144', '144', appIcon, '--out', join(iconPack, 'icon.png')], {
    stdio: 'ignore'
  })
}
console.log(`Wrote icon pack with ${packIcons.length} icons`)
