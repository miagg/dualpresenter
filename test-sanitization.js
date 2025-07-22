// Test the sanitization logic
function sanitizeName(name) {
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

// Test cases
const testNames = [
  'Κριεκούκης Παναγιώτης ', // trailing space
  '  John Doe  ', // leading and trailing spaces
  'Jane   Smith', // multiple spaces
  'Test<Name>', // invalid characters
  'File:Name\\Test', // more invalid characters
  '...Test Name...', // leading/trailing dots
  'Normal Name', // normal case
  'José María', // accented characters
  '中文姓名' // Chinese characters
]

console.log('Name Sanitization Tests:')
testNames.forEach((name) => {
  const sanitized = sanitizeName(name)
  const changed = name !== sanitized
  console.log(`"${name}" -> "${sanitized}"${changed ? ' (CHANGED)' : ''}`)
})
