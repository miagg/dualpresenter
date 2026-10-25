import { shell } from 'electron'
import { execFile } from 'child_process'
import path from 'path'
import { Data } from '../interfaces/Data'

// Column of the slide title on the SLIDES sheet (order, type, title, ...)
const TITLE_COLUMN = 'C'

// How long to wait for Excel to open the workbook before giving up
const WAIT_ATTEMPTS = 40
const WAIT_INTERVAL_MS = 500

// Selects the title cell of a row on the first (SLIDES) sheet once Excel has the workbook open.
// It only talks to Excel if it is already running, so a file opened in another app (e.g.
// Numbers) is left alone.
const MAC_SCRIPT = `
on run argv
  set targetName to item 1 of argv
  set targetRow to (item 2 of argv) as integer
  repeat ${WAIT_ATTEMPTS} times
    if application id "com.microsoft.Excel" is running then
      tell application id "com.microsoft.Excel"
        if (name of every workbook) contains targetName then
          set wb to workbook targetName
          activate object wb
          set ws to worksheet 1 of wb
          activate object ws
          goto reference (range ("A" & targetRow) of ws) with scroll
          select (range ("${TITLE_COLUMN}" & targetRow) of ws)
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
$row = [int]$env:DP_EXCEL_ROW
for ($i = 0; $i -lt ${WAIT_ATTEMPTS}; $i++) {
  try { $xl = [Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application') } catch { $xl = $null }
  if ($xl) {
    foreach ($wb in $xl.Workbooks) {
      if ($wb.FullName -ieq $path) {
        $ws = $wb.Worksheets.Item(1)
        $wb.Activate()
        $ws.Activate()
        $xl.Goto($ws.Range("A$row"), $true)
        $ws.Range("${TITLE_COLUMN}$row").Select() | Out-Null
        exit 0
      }
    }
  }
  Start-Sleep -Milliseconds ${WAIT_INTERVAL_MS}
}
`

const selectRow = (excelPath: string, row: number): void => {
  const onDone = (error: Error | null): void => {
    if (error) console.error('Could not select the slide row in Excel:', error.message)
  }

  if (process.platform === 'darwin') {
    execFile('osascript', ['-e', MAC_SCRIPT, path.basename(excelPath), String(row)], onDone)
  } else if (process.platform === 'win32') {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', WINDOWS_SCRIPT],
      {
        windowsHide: true,
        env: { ...process.env, DP_EXCEL_PATH: excelPath, DP_EXCEL_ROW: String(row) }
      },
      onDone
    )
  }
}

// Opens the Excel file and, in Microsoft Excel, selects the title of the current slide
export const editExcelFile = (data: Data): void => {
  const excelPath = data.state.excelPath
  if (!excelPath) return

  shell.openExternal(`file://${excelPath}`)

  // Card ids are their position in the sheet (blank and invalid rows included), and row 1 is
  // the header
  const card = data.cards[data.state.currentSlideIndex]
  if (card && Number.isInteger(card.id)) {
    selectRow(excelPath, card.id + 1)
  }
}
