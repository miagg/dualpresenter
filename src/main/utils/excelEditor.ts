import { shell } from 'electron'
import { execFile } from 'child_process'
import path from 'path'
import { Data } from '../interfaces/Data'
import { audioManager } from './audioManager'

// Where things are in the workbook: sheet number (1-based) and column of the field to select
const SLIDES_SHEET = 1
const NAMES_SHEET = 2
// Slide title on the SLIDES sheet (order, type, title, ...)
const TITLE_COLUMN = 'C'
// Name on the NAMES sheet (name, group, attending)
const NAME_COLUMN = 'A'

// How long to wait for Excel to open the workbook before giving up
const WAIT_ATTEMPTS = 40
const WAIT_INTERVAL_MS = 500

interface CellTarget {
  sheet: number
  row: number
  column: string
}

// Selects a cell once Excel has the workbook open, scrolling its row to the top. It only talks
// to Excel if it is already running, so a file opened in another app (e.g. Numbers) is left
// alone.
const MAC_SCRIPT = `
on run argv
  set targetName to item 1 of argv
  set targetSheet to (item 2 of argv) as integer
  set targetRow to (item 3 of argv) as integer
  set targetColumn to item 4 of argv
  repeat ${WAIT_ATTEMPTS} times
    if application id "com.microsoft.Excel" is running then
      tell application id "com.microsoft.Excel"
        if (name of every workbook) contains targetName then
          set wb to workbook targetName
          activate object wb
          set ws to worksheet targetSheet of wb
          activate object ws
          goto reference (range ("A" & targetRow) of ws) with scroll
          select (range (targetColumn & targetRow) of ws)
          return "ok"
        end if
      end tell
    end if
    delay ${WAIT_INTERVAL_MS / 1000}
  end repeat
  return "timeout"
end run
`

const WINDOWS_SCRIPT = `
$path = $env:DP_EXCEL_PATH
$sheet = [int]$env:DP_EXCEL_SHEET
$row = [int]$env:DP_EXCEL_ROW
$column = $env:DP_EXCEL_COLUMN
for ($i = 0; $i -lt ${WAIT_ATTEMPTS}; $i++) {
  try { $xl = [Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application') } catch { $xl = $null }
  if ($xl) {
    foreach ($wb in $xl.Workbooks) {
      if ($wb.FullName -ieq $path) {
        $ws = $wb.Worksheets.Item($sheet)
        $wb.Activate()
        $ws.Activate()
        $xl.Goto($ws.Range("A$row"), $true)
        $ws.Range("$column$row").Select() | Out-Null
        exit 0
      }
    }
  }
  Start-Sleep -Milliseconds ${WAIT_INTERVAL_MS}
}
`

const selectCell = (excelPath: string, { sheet, row, column }: CellTarget): void => {
  const onDone = (error: Error | null): void => {
    if (error) console.error('Could not select the cell in Excel:', error.message)
  }

  if (process.platform === 'darwin') {
    execFile(
      'osascript',
      ['-e', MAC_SCRIPT, path.basename(excelPath), String(sheet), String(row), column],
      onDone
    )
  } else if (process.platform === 'win32') {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', WINDOWS_SCRIPT],
      {
        windowsHide: true,
        env: {
          ...process.env,
          DP_EXCEL_PATH: excelPath,
          DP_EXCEL_SHEET: String(sheet),
          DP_EXCEL_ROW: String(row),
          DP_EXCEL_COLUMN: column
        }
      },
      onDone
    )
  }
}

// Row ids are their position in the sheet (blank and invalid rows included), and row 1 is the
// header, so an item's row is its id + 1

// The name of a paused audible names playback, else the title of the current slide
const editTarget = (data: Data): CellTarget | null => {
  const card = data.cards[data.state.currentSlideIndex]

  const pausedName = audioManager.getPausedName()
  if (pausedName) {
    // The same name can appear in more than one group: prefer the current slide's group
    const name =
      data.names.find((n) => n.name === pausedName && n.group === card?.group) ??
      data.names.find((n) => n.name === pausedName)
    if (name && Number.isInteger(name.id)) {
      return { sheet: NAMES_SHEET, row: name.id + 1, column: NAME_COLUMN }
    }
  }

  if (card && Number.isInteger(card.id)) {
    return { sheet: SLIDES_SHEET, row: card.id + 1, column: TITLE_COLUMN }
  }
  return null
}

// Opens the Excel file and, in Microsoft Excel, selects the paused name or the current slide
export const editExcelFile = (data: Data): void => {
  const excelPath = data.state.excelPath
  if (!excelPath) return

  shell.openExternal(`file://${excelPath}`)

  const target = editTarget(data)
  if (target) selectCell(excelPath, target)
}
