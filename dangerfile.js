// danger removes this import, so don't do anything fancy with it
const {danger, warn, message} = require('danger')

// it leaves the rest of the imports alone, though
const {readFileSync} = require('fs')

//
// Run danger
//

main()

//
// The entry point of this script
//

function main() {
  const taskName = String(process.env.task)

  if (taskName === 'ANDROID') {
    runAndroid()
  } else if (taskName === 'IOS') {
    runiOS()
  } else if (taskName === 'GREENKEEPER') {
    runGeneral()
    runGreenkeeper()
  } else if (taskName === 'JS-data') {
    runJSのData()
    runJSのBusData()
  } else if (taskName === 'JS-flow') {
    runJSのFlow()
  } else if (taskName === 'JS-jest') {
    runJSのJest()
  } else if (taskName === 'JS-lint') {
    runJSのLint()
  } else if (taskName === 'JS-prettier') {
    runJSのPrettier()
  } else {
    const taskName = String(process.env.task)
    warn(`Unknown task name "${taskName}"; Danger cannot report anything.`)
  }
}

//
// Individual Danger "tasks"
//

function runAndroid() {
  message('android: nothing to do')
}

function runiOS() {
  // ideas:
  // - tee the "fastlane" output to a log, and run the analysis script
  //   to report back the longest compilation units
  //   (maybe only on react-native / package.json changes?)
  // - report the .ipa size
  // - report the .ipa file list
  message('iOS: nothing to do')
}

function runGeneral() {
  //
  // New js files should have `@flow` at the top
  //
  danger.git.created_files
    .filter(path => path.endsWith('.js'))
    // except for those in /flow-typed
    .filter(filepath => !filepath.includes('flow-typed'))
    .filter(filepath => !readFile(filepath).includes('@flow'))
    .forEach(file =>
      warn(`<code>${file}</code> has no <code>@flow</code> annotation!`),
    )

  //
  // Warn when package.json is changed but yarn.lock is not
  //
  const packageChanged = danger.git.modified_files.includes('package.json')
  const lockfileChanged = danger.git.modified_files.includes('yarn.lock')
  if (packageChanged && !lockfileChanged) {
    const message = 'Changes were made to package.json, but not to yarn.lock'
    const idea = 'Perhaps you need to run <code>yarn install</code>?'
    warn(`${message} - <i>${idea}</i>`)
  }

  //
  // Warn if tests have been enabled to the exclusion of all others
  //
  danger.git.created_files
    .filter(path => path.endsWith('.js'))
    .filter(filepath => filepath.endsWith('test.js'))
    .filter(filepath => {
      const content = readFile(filepath)
      return content.includes('it.only') || content.includes('describe.only')
    })
    .forEach(file =>
      warn(
        `An <code>only</code> was left in ${file} – no other tests can run.`,
      ),
    )

  //
  // Warn when PR size is large (mainly for hawken)
  //
  const bigPRThreshold = 400 // lines
  const thisPRSize = danger.github.pr.additions + danger.github.pr.deletions
  if (thisPRSize > bigPRThreshold) {
    warn(
      h.details(
        h.summary('❗️ Big PR!'),
        h.blockquote(
          h.p(
            `We like to try and keep PRs under ${bigPRThreshold} lines, and this one was ${thisPRSize} lines.`,
          ),
          h.p(
            'If the PR contains multiple logical changes, splitting each change into a separate PR will allow a faster, easier, and more thorough review.',
          ),
        ),
      ),
    )
  }
}

function runGreenkeeper() {
  message('greenkeeper: nothing to do')
}

function runJSのData() {
  const dataValidationLog = readLogFile('./logs/validate-data')

  if (!dataValidationLog) {
    return
  }

  if (!isBadDataValidationLog(dataValidationLog)) {
    return
  }

  fileLog("Something's up with the data.", dataValidationLog)
}

function runJSのBusData() {
  const busDataValidationLog = readLogFile('./logs/validate-bus-data')

  if (!busDataValidationLog) {
    return
  }

  if (!isBadDataValidationLog(busDataValidationLog)) {
    return
  }

  fileLog("🚌 Something's up with the bus routes.", busDataValidationLog)
}

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

function runJSのJest() {
  const jestLog = readLogFile('./logs/jest')

  if (!jestLog) {
    return
  }

  if (!jestLog.includes('FAIL')) {
    return
  }

  const lines = jestLog.split('\n')
  const startIndex = lines.findIndex(l =>
    l.includes('Summary of all failing tests'),
  )

  fileLog(
    'Some Jest tests failed. Take a peek?',
    lines.slice(startIndex).join('\n'),
  )
}

function runJSのLint() {
  const eslintLog = readLogFile('./logs/eslint')

  if (!eslintLog) {
    return
  }

  fileLog('Eslint had a thing to say!', eslintLog)
}

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

// eslint-disable-next-line no-var
var h = new Proxy(
  {},
  {
    get(_, property) {
      return function(...children) {
        return `<${property}>${children.join('\n')}</${property}>`
      }
    },
  },
)

// eslint-disable-next-line no-var
var m = new Proxy(
  {},
  {
    get(_, property) {
      return function(attrs, ...children) {
        switch (property) {
          case 'code': {
            return (
              '```' +
              (attrs.language || '') +
              '\n' +
              children.join('\n') +
              '\n' +
              '```'
            )
          }
          default:
            throw new Error(`unknown markdown thing requested: ${property}`)
        }
      }
    },
  },
)

function readFile(filename) {
  try {
    return readFileSync(filename, 'utf-8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      return ''
    }
    return err.message
  }
}

function readLogFile(filename) {
  return readFile(filename).trim()
}

function isBadBundleLog(log) {
  const allLines = log.split('\n')
  const requiredLines = [
    'bundle: start',
    'bundle: finish',
    'bundle: Done writing bundle output',
    'bundle: Done copying assets',
  ]
  return requiredLines.some(line => !allLines.includes(line))
}

function isBadDataValidationLog(log) {
  return log.split('\n').some(l => !l.endsWith('is valid'))
}

function fileLog(name, log, {lang = null} = {}) {
  return message(h.details(h.summary(name), m.code({language: lang}, log)))
}
