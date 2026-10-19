# DualPresenter Stream Deck plugin

Controls DualPresenter from an Elgato Stream Deck. Every key is drawn by the plugin, so it always
shows live state: black out turns red, freeze turns blue, the play key shows the name being read
with its position (e.g. `3/12`) and a progress bar, and so on. Keys show `APP OFFLINE` while
DualPresenter isn't running and reconnect on their own when it starts.

Requires Stream Deck 7.1 or later.

## Actions

| Action                     | Key shows                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------- |
| Black Out                  | Red with `SCREENS BLACK` while on, `LIVE` otherwise                                   |
| Freeze Output              | Red with the slide being held while frozen                                            |
| Frozen Slide               | The frozen slide's number and title; press to go back to it                           |
| Slide Transitions On/Off   | Blue with the duration while on                                                       |
| Current Slide              | `5/61`, slide title, progress through the show; red frame when it is the frozen slide |
| Next / Previous Slide      | Target slide number and title; greyed at the ends                                     |
| Go To Slide                | Chosen slide number and title; green while it is on screen                            |
| Flip Screens               | Which screens are assigned                                                            |
| Play / Stop Names          | `Playing 3/12`, current name, progress; amber while paused                            |
| Stop Names                 | Position while playing                                                                |
| Next / Previous Name       | Position while playing                                                                |
| Audible Names On/Off       | Purple while on                                                                       |
| Auto Playback On/Off       | Teal while on                                                                         |
| Next / Previous Names Page | Page of the main or side screen, e.g. `2/3`                                           |
| Names Precedence + / −     | Current precedence                                                                    |
| Reload Data                | Name of the open Excel file                                                           |
| Edit Excel File            | Name of the open Excel file; opens it in Excel                                        |
| Open / Close Excel File    | Name of the open Excel file                                                           |
| Settings                   | Blue while the settings window is open                                                |
| Search                     | Blue while search is open; opens it ready to type, or closes it                       |
| Open DualPresenter         | App icon; RUNNING or OPEN. Starts the app, or brings it to the front                  |
| Slide Dial (Stream Deck +) | Turn: change slide, press: black out, touch: freeze                                   |
| Names Dial (Stream Deck +) | Turn: previous/next name, press: play/stop                                            |

## More keys than fit on the page

Stream Deck folders are a built-in Stream Deck feature, so the folder itself can't come from the
plugin. To make one that matches the plugin's keys:

1. Drag **Create Folder** (Stream Deck → Navigation) onto a key and put the extra actions in it.
2. Click the folder key's image, choose **Icon Library**, open **DualPresenter**, and pick **More**.
3. Clear the folder's title, since the icon already says MORE.

The pack also has a **Back** icon, for Stream Deck's Previous Page action, and a **Go to slide**
icon for the numpad folder below.

## Jumping to a slide by number

Press **Current Slide** to open the numpad: a page that comes with the plugin (15-key Stream Deck).
Type the number, check the slide title on the Go key, and press **Go**; the deck jumps to the slide
and returns to the page you came from. **Back** returns without jumping. The first time, Stream
Deck installs the numpad page, and may ask you to confirm.

Digit keys grey out when they would make a slide number that doesn't exist, and a half-typed number
clears itself after 15 seconds.

The numpad keys (**Numpad Digit**, **Numpad Go**, **Numpad Delete**) can also be put in your own
folder, e.g. on other Stream Deck models. Each Numpad Digit you add takes the next digit (1…9,
then 0). In a folder, Go can't leave the folder for you.

## Development

```bash
cd streamdeck
npm install
npm run build      # generates manifest.json and icons, bundles bin/plugin.js
npm run link       # installs the plugin into Stream Deck (symlink)
npm run install-icons  # installs the DualPresenter icon pack (restart Stream Deck to see it)
npx streamdeck restart com.miagg.dualpresenter
npm run pack       # builds dist/com.miagg.dualpresenter.streamDeckPlugin for sharing
```

The numpad page is generated by `scripts/assets.ts` into `profiles/numpad.streamDeckProfile`.
Stream Deck installs it the first time Current Slide or Open Numpad is pressed (15-key Stream
Deck only).


The actions are defined once in `src/actions.ts`; `scripts/assets.ts` builds `manifest.json`
and the icons from it, so don't edit the manifest by hand.

## How it talks to the app

DualPresenter runs a small HTTP server on `127.0.0.1:47321` (`src/main/remoteControl.ts`; the
port can be changed with the `DUALPRESENTER_REMOTE_PORT` environment variable, for both the app
and the plugin). It only accepts connections from this machine and refuses requests made by web
pages.

- `GET /state` returns the current state as JSON
- `GET /events` streams the state (Server-Sent Events) whenever it changes
- `POST /action` with a JSON body such as `{"action": "toggle-black-out"}` runs an action

Actions: `next-slide`, `prev-slide`, `goto-slide` (`index`, zero-based), `toggle-black-out`,
`toggle-freeze`, `toggle-transitions`, `flip-screens`, `reload-data`, `edit-excel`, `open-excel`, `close-excel`, `open-settings`, `toggle-search`, `focus-app`, `toggle-audible-names`, `toggle-auto-playback`,
`toggle-audio-playback`, `stop-audio`, `next-name`, `prev-name`, `next-page` / `prev-page`
(`screen`: `main` or `side`), `precedence-up`, `precedence-down`.

```bash
curl -X POST -H 'Content-Type: application/json' -d '{"action":"toggle-black-out"}' http://127.0.0.1:47321/action
```

The same API can be used by other controllers, e.g. Bitfocus Companion.
