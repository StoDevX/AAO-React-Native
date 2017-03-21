import {danger, warn, message} from 'danger'
import {readFileSync} from 'fs'
import dedent from 'dedent'
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
      <blockquote>
        <p>We like to try and keep PRs under ${bigPRThreshold} lines, and this one was ${thisPRSize} lines.</p>
        <p>If the PR contains multiple logical changes, splitting each change into a separate PR will allow a faster, easier, and more thorough review.</p>
      </blockquote>
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
const isBadDataValidationLog = log => {
  return log.split('\n').some(l => !l.endsWith('is valid'))
}

const fileLog = (name, log, {lang = null}={}) => {
  message(
    dedent`
    <details>
      <summary>${name} (${log.length} chars)</summary>

\`\`\`${lang || ''}
${log}
\`\`\`

    </details>
  `,
  )
}

const prettierLog = readLogFile('logs/prettier')
const eslintLog = readLogFile('logs/eslint')
const dataValidationLog = readLogFile('logs/validate-data')
const dataBundlingLog = readLogFile('logs/bundle-data')
const flowLog = readLogFile('logs/flow')
const iosJsBundleLog = readLogFile('logs/bundle-ios')
const androidJsBundleLog = readLogFile('logs/bundle-android')
const jestLog = readLogFile('logs/jest')

console.log('prettierLog', Buffer.from(prettierLog))
console.log('eslintLog', Buffer.from(eslintLog))
console.log('dataValidationLog', Buffer.from(dataValidationLog))
console.log('dataBundlingLog', Buffer.from(dataBundlingLog))
console.log('flowLog', Buffer.from(flowLog))
console.log('iosJsBundleLog', Buffer.from(iosJsBundleLog))
console.log('androidJsBundleLog', Buffer.from(androidJsBundleLog))
console.log('jestLog', Buffer.from(jestLog))

if (prettierLog.length) {
  fileLog('Prettier made some changes', prettierLog, {lang: 'diff'})
  message(`prettierLog is ${prettierLog.length} chars long and is ${JSON.stringify(Boolean(prettierLog))}`)
}

if (eslintLog) {
  fileLog('Eslint had a thing to say!', eslintLog)
  message(`eslintLog is ${eslintLog.length} chars long and is ${JSON.stringify(Boolean(eslintLog))}`)
}

if (isBadDataValidationLog(dataValidationLog)) {
  fileLog("Something's up with the data.", dataValidationLog)
  message(`dataValidationLog is ${dataValidationLog.length} chars long and is ${JSON.stringify(Boolean(dataValidationLog))}`)
}

if (dataBundlingLog) {
  fileLog('Some files need to be re-bundled', dataBundlingLog, {lang: 'diff'})
  message(`dataBundlingLog is ${dataBundlingLog.length} chars long and is ${JSON.stringify(Boolean(dataBundlingLog))}`)
}

if (flowLog !== 'Found 0 errors') {
  fileLog('Flow would like to interject about types…', flowLog)
  message(`flowLog is ${flowLog.length} chars long and is ${JSON.stringify(Boolean(flowLog))}`)
}

if (isBadBundleLog(iosJsBundleLog)) {
  fileLog('The iOS bundle ran into an issue.', iosJsBundleLog)
  message(`iosJsBundleLog is ${iosJsBundleLog.length} chars long and is ${JSON.stringify(Boolean(iosJsBundleLog))}`)
}

if (isBadBundleLog(androidJsBundleLog)) {
  fileLog('The Android bundle ran into an issue.', androidJsBundleLog)
  message(`androidJsBundleLog is ${androidJsBundleLog.length} chars long and is ${JSON.stringify(Boolean(androidJsBundleLog))}`)
}

if (jestLog.includes('FAIL')) {
  const lines = jestLog.split('\n')
  const startIndex = lines.findIndex(l =>
    l.includes('Summary of all failing tests'))

  fileLog(
    'Some Jest tests failed. Take a peek?',
    lines.slice(startIndex).join('\n'),
  )
}
