import {danger, warn, message} from 'danger'
import {readFileSync} from 'fs'
import dedent from 'dedent'
const readFile = filename => {
  try {
    return readFileSync(filename, 'utf-8')
  } catch (err) {
    return err.message
  }
}

const jsFiles = danger.git.created_files.filter(path => path.endsWith('.js'))

// new js files should have `@flow` at the top
jsFiles
  .filter(filepath => {
    const content = readFile(filepath)
    return !content.includes('@flow')
  })
  .forEach(file => warn(`<code>${file}</code> has no <code>@flow</code> annotation!`))

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
    warn(`An <code>only</code> was left in ${file} – no other tests can run.`))

// Warn when PR size is large (mainly for hawken)
const bigPRThreshold = 400 // lines
const thisPRSize = danger.github.pr.additions + danger.github.pr.deletions
if (thisPRSize > bigPRThreshold) {
  warn(
    dedent`
    <details>
      <summary>:exclamation: Big PR!</summary>
      <blockquote>We like to try and keep PRs under ${bigPRThreshold} lines per PR, and this one was ${thisPRSize} lines.</blockquote>
      <blockquote>If the PR contains multiple logical changes, splitting each change into a separate PR will allow a faster, easier, and more thorough review.</blockquote>
    </details>
  `,
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

const fileLog = (name, log, {lang = null}={}) => {
  message(
    dedent`
    <details>
      <summary>${name}</summary>

\`\`\`${lang || ''}
${log}
\`\`\`

    </details>
  `,
  )
}

const prettierLog = readFile('logs/prettier').trim()
const eslintLog = readFile('logs/eslint').trim()
const dataValidationLog = readFile('logs/validate-data').trim()
const dataBundlingLog = readFile('logs/bundle-data').trim()
const flowLog = readFile('logs/flow').trim()
const iosJsBundleLog = readFile('logs/bundle-ios').trim()
const androidJsBundleLog = readFile('logs/bundle-android').trim()
const jestLog = readFile('logs/jest').trim()

if (prettierLog) {
  fileLog('Prettier made some changes', eslintLog, {lang: 'diff'})
}

if (eslintLog) {
  fileLog('Eslint had a thing to say!', eslintLog)
}

const dataHadIssues = dataValidationLog &&
  dataValidationLog.split('\n').some(l => !l.endsWith('is valid'))
if (dataHadIssues) {
  fileLog("Something's up with the data.", dataValidationLog)
}

if (dataBundlingLog) {
  fileLog('Some files need to be re-bundled', dataBundlingLog, {lang: 'diff'})
}

if (flowLog !== 'Found 0 errors') {
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
    l.includes('Summary of all failing tests'))

  fileLog(
    'Some Jest tests failed. Take a peek?',
    lines.slice(startIndex).join('\n'),
  )
}
