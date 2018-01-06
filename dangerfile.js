// @flow

// danger (removed by danger)
import {danger, schedule, markdown, warn, fail} from 'danger'

// danger plugins
import yarn from 'danger-plugin-yarn'

async function main() {
  const taskName = String(process.env.task)

  switch (taskName) {
    case 'ANDROID':
      await runAndroid()
      break
    case 'IOS':
      await runiOS()
      break
    case 'GREENKEEPER':
      await runGreenkeeper()
      break
    case 'JS-general':
      await runJSのGeneral()
      await yarn()
      break
    case 'JS-data':
      await runJSのData()
      break
    case 'JS-flow':
      await runJSのFlow()
      break
    case 'JS-jest':
      await runJSのJest()
      break
    case 'JS-lint':
      await runJSのLint()
      break
    case 'JS-prettier':
      await runJSのPrettier()
      break
    default:
      warn(`Unknown task name "${taskName}"; Danger cannot report anything.`)
  }
}

//
// task=GREENKEEPER
//

function runGreenkeeper() {
  // message('greenkeeper ran')
}

//
// task=ANDROID
//

function runAndroid() {
}

//
// task=IOS
//

function runiOS() {
}

//
// task=JS-data
//

async function runJSのData() {
  await runJSのDataのData()
  await runJSのDataのBusData()
}

function runJSのDataのData() {
  const dataValidationLog = readLogFile('./logs/validate-data')

  if (!dataValidationLog) {
    return
  }

  if (!isBadDataValidationLog(dataValidationLog)) {
    return
  }

  fileLog("Something's up with the data.", dataValidationLog)
}

function runJSのDataのBusData() {
  const busDataValidationLog = readLogFile('./logs/validate-bus-data')

  if (!busDataValidationLog) {
    return
  }

  if (!isBadDataValidationLog(busDataValidationLog)) {
    return
  }

  fileLog("🚌 Something's up with the bus routes.", busDataValidationLog)
}

//
// task=JS-general
//

async function runJSのGeneral() {
  await flowAnnotated()
  await bigPr()
  await exclusionaryTests()
}

// New js files should have `@flow` at the top
function flowAnnotated() {
  danger.git.created_files
    .filter(path => path.endsWith('.js'))
    // except for those in /flow-typed
    .filter(filepath => !filepath.includes('flow-typed'))
    .filter(filepath => !readFile(filepath).includes('@flow'))
    .forEach(file =>
      warn(`<code>${file}</code> has no <code>@flow</code> annotation!`),
    )
}

// Warn if tests have been enabled to the exclusion of all others
function exclusionaryTests() {
  danger.git.created_files
    .filter(filepath => filepath.endsWith('.test.js'))
    .map(filepath => ({filepath, content: readFile(filepath)}))
    .filter(
      ({content}) =>
        content.includes('it.only') || content.includes('describe.only'),
    )
    .forEach(({filepath}) =>
      warn(
        `An <code>only</code> was left in ${filepath} – no other tests can run.`,
      ),
    )
}

// Warn when PR size is large (mainly for hawken)
function bigPr() {
  const bigPRThreshold = 400 // lines
  const thisPRSize = danger.github.pr.additions + danger.github.pr.deletions
  if (thisPRSize > bigPRThreshold) {
    warn(
      h.details(
        h.summary(
          `Big PR! We like to try and keep PRs under ${bigPRThreshold} lines, and this one was ${thisPRSize} lines.`,
        ),
        h.p(
          'If the PR contains multiple logical changes, splitting each change into a separate PR will allow a faster, easier, and more thorough review.',
        ),
      ),
    )
  }
}


async function gradle() {
  await buildDotGradle()
  await mainDotJava()
  await settingsDotGradleSpacing()
}

// Ensure that the build.gradle dependencies list is sorted
function buildDotGradle() {
}

// Ensure that the MainApplication.java imports list is sorted
function mainDotJava() {
}

// Enforce spacing in the settings.gradle file
function settingsDotGradleSpacing() {
}

//
// task=JS-flow
//

function runJSのFlow() {
  const flowLog = readLogFile('./logs/flow')

  if (!flowLog) {
    return
  }

  if (flowLog === 'Found 0 errors') {
    return
  }

  fileLog('Flow would like to interject about types…', flowLog)
}

//
// JS-jest
//

function runJSのJest() {
}

//
// JS-lint
//

function runJSのLint() {
  const eslintLog = readLogFile('./logs/eslint')

  if (!eslintLog) {
    return
  }

  fileLog('Eslint had a thing to say!', eslintLog)
}

//
// JS-prettier
//

function runJSのPrettier() {
  const prettierLog = readLogFile('./logs/prettier')

  if (!prettierLog) {
    return
  }

  fileLog('Prettier made some changes', prettierLog, {lang: 'diff'})
}

//
// Utilities
//

import fs from 'fs'
export const h /*: any*/ = new Proxy(
  {},
  {
    get(_, property) {
      return function(...children /*: Array<string>*/) {
        if (!children.length) {
          return `<${property}>`
        }
        return `<${property}>${children.join('\n')}</${property}>`
      }
    },
  },
)

export const m = {
  code(attrs /*: Object*/, ...children /*: Array<string>*/) {
    return (
      '\n' +
      '```' +
      (attrs.language || '') +
      '\n' +
      children.join('\n') +
      '\n' +
      '```' +
      '\n'
    )
  },
  json(blob /*: any*/) {
    return m.code({language: 'json'}, JSON.stringify(blob, null, 2))
  },
}

export function readFile(filename /*: string*/) {
  try {
    return fs.readFileSync(filename, 'utf-8')
  } catch (err) {
    fail(
      h.details(
        h.summary(`Could not read <code>${filename}</code>`),
        m.json(err),
      ),
    )
    return ''
  }
}

export function readLogFile(filename /*: string*/) {
  return readFile(filename).trim()
}

export function readJsonLogFile(filename /*: string*/) {
  try {
    return JSON.parse(readFile(filename))
  } catch (err) {
    fail(
      h.details(
        h.summary(`Could not read the log file at <code>${filename}</code>`),
        m.json(err),
      ),
    )
    return []
  }
}

export function isBadDataValidationLog(log /*: string*/) {
  return log.split('\n').some(l => !l.endsWith('is valid'))
}

export function fileLog(
  name /*: string*/,
  log /*: string*/,
  {lang = null} /*: any*/ = {},
) {
  return markdown(
    `## ${name}

${m.code({language: lang}, log)}`,
  )
}

//
// Run the file
//
schedule(main)
