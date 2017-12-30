/* global danger: 0, warn: 0, message: 0 */
import {readFileSync} from 'fs'
const readFile = filename => {
  try {
    return readFileSync(filename, 'utf-8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      return ''
    }
    return err.message
  }
}
const readLogFile = filename => readFile(filename).trim()

const jsFiles = danger.git.created_files.filter(path => path.endsWith('.js'))

// new js files should have `@flow` at the top
jsFiles
  // except for those in /flow-typed
  .filter(filepath => !filepath.includes('flow-typed'))
  .filter(filepath => {
    const content = readFile(filepath)
    return !content.includes('@flow')
  })
  .forEach(file =>
    warn(`<code>${file}</code> has no <code>@flow</code> annotation!`),
  )

// revisit this when we move to yarn
// const packageChanged = danger.git.modified_files.includes('package.json')
// const lockfileChanged = danger.git.modified_files.includes('yarn.lock')
// if (packageChanged && !lockfileChanged) {
//   const message = 'Changes were made to package.json, but not to yarn.lock'
//   const idea = 'Perhaps you need to run <code>yarn install</code>?'
//   warn(`${message} - <i>${idea}</i>`)
// }

// Be careful of leaving testing shortcuts in the codebase
jsFiles
  .filter(filepath => filepath.endsWith('test.js'))
  .filter(filepath => {
    const content = readFile(filepath)
    return content.includes('it.only') || content.includes('describe.only')
  })
  .forEach(file =>
    warn(`An <code>only</code> was left in ${file} – no other tests can run.`),
  )

// Warn when PR size is large (mainly for hawken)
const bigPRThreshold = 400 // lines
const thisPRSize = danger.github.pr.additions + danger.github.pr.deletions
if (thisPRSize > bigPRThreshold) {
  warn(
    `
<details>
  <summary>:exclamation: Big PR!</summary>
  <blockquote>
    <p>We like to try and keep PRs under ${bigPRThreshold} lines, and this one was ${thisPRSize} lines.</p>
    <p>If the PR contains multiple logical changes, splitting each change into a separate PR will allow a faster, easier, and more thorough review.</p>
  </blockquote>
</details>`,
  )
}

//
// Check for and report errors from our tools
//
const isBadBundleLog = log => {
  const allLines = log.split('\n')
  const requiredLines = [
    'bundle: start',
    'bundle: finish',
    'bundle: Done writing bundle output',
    'bundle: Done copying assets',
  ]
  return requiredLines.some(line => !allLines.includes(line))
}
const isBadDataValidationLog = log => {
  return log.split('\n').some(l => !l.endsWith('is valid'))
}

const fileLog = (name, log, {lang = null} = {}) => {
  message(
    `
<details>
  <summary>${name}</summary>

\`\`\`${lang || ''}
${log}
\`\`\`

</details>`,
  )
}

const prettierLog = readLogFile('logs/prettier')
const eslintLog = readLogFile('logs/eslint')
const dataValidationLog = readLogFile('logs/validate-data')
const busDataValidationLog = readLogFile('logs/validate-bus-data')
const flowLog = readLogFile('logs/flow')
const iosJsBundleLog = readLogFile('logs/bundle-ios')
const androidJsBundleLog = readLogFile('logs/bundle-android')
const jestLog = readLogFile('logs/jest')

if (prettierLog) {
  fileLog('Prettier made some changes', prettierLog, {lang: 'diff'})
}

if (eslintLog) {
  fileLog('Eslint had a thing to say!', eslintLog)
}

if (dataValidationLog && isBadDataValidationLog(dataValidationLog)) {
  fileLog("Something's up with the data.", dataValidationLog)
}

if (busDataValidationLog && isBadDataValidationLog(busDataValidationLog)) {
  fileLog("🚌 Something's up with the bus routes.", busDataValidationLog)
}

if (flowLog && flowLog !== 'Found 0 errors') {
  fileLog('Flow would like to interject about types…', flowLog)
}

if (iosJsBundleLog && isBadBundleLog(iosJsBundleLog)) {
  fileLog('The iOS bundle ran into an issue.', iosJsBundleLog)
}

if (androidJsBundleLog && isBadBundleLog(androidJsBundleLog)) {
  fileLog('The Android bundle ran into an issue.', androidJsBundleLog)
}

if (jestLog && jestLog.includes('FAIL')) {
  const lines = jestLog.split('\n')
  const startIndex = lines.findIndex(l =>
    l.includes('Summary of all failing tests'),
  )

  fileLog(
    'Some Jest tests failed. Take a peek?',
    lines.slice(startIndex).join('\n'),
  )
}
