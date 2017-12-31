// @flow

// danger removes this import, so don't do anything fancy with it
const {danger, warn, message, schedule, fail} = require('danger')

// it leaves the rest of the imports alone, though
import yarn from 'danger-plugin-yarn'
const {readFileSync} = require('fs')
const uniq = require('lodash/uniq')
const isEqual = require('lodash/isEqual')
// depended on by react-native (and us)
const xcode = require('xcode')
// depended on by xcode (and us)
const plist = require('simple-plist')

//
// The entry point of this script
//

async function main() {
  const taskName = String(process.env.task)

  if (taskName === 'ANDROID') {
    await runAndroid()
  } else if (taskName === 'IOS') {
    schedule(runiOS())
  } else if (taskName === 'GREENKEEPER') {
    await runGeneral()
    await runGreenkeeper()
    await yarn()
  } else if (taskName === 'JS-data') {
    await runJSのData()
    await runJSのBusData()
  } else if (taskName === 'JS-flow') {
    await runJSのFlow()
  } else if (taskName === 'JS-jest') {
    await runJSのJest()
  } else if (taskName === 'JS-lint') {
    await runJSのLint()
  } else if (taskName === 'JS-prettier') {
    await runJSのPrettier()
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

async function runGeneral() {
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
  const packageDiff = await danger.git.JSONDiffForFile('package.json')
  const depsChanged =
    'dependencies' in packageDiff || 'devDependencies' in packageDiff
  if (packageChanged && depsChanged && !lockfileChanged) {
    const msg =
      'Changes were made to <code>package.json</code>, but not to <code>yarn.lock</code>.'
    const idea = 'Perhaps you need to run <code>yarn install</code>?'
    warn(`${msg} ${idea}`)
  }

  //
  // Warn if tests have been enabled to the exclusion of all others
  //
  danger.git.created_files
    .filter(filepath => filepath.endsWith('.test.js'))
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
      `Big PR! We like to try and keep PRs under ${bigPRThreshold} lines, and this one was ${thisPRSize} lines.<br>If the PR contains multiple logical changes, splitting each change into a separate PR will allow a faster, easier, and more thorough review.`,
    )
  }

  //
  // Remind us to check the xcodeproj, if it's changed
  //
  const pbxprojChanged = danger.git.modified_files.find(filepath =>
    filepath.endsWith('project.pbxproj'),
  )
  message(`pbxprojChanged?: ${pbxprojChanged}`)
  if (pbxprojChanged) {
    warn('The Xcode project file changed. Double-check the changes!')

    // Warn about a blank line that Xcode will re-insert if we remove
    const pbxproj = readFileSync(pbxprojChanged, 'utf-8').split('\n')
    if (pbxproj[7] !== '') {
      fail(
        "Line 8 of the .pbxproj needs to be an empty line to match Xcode's formatting",
      )
    }

    // Warn about numbers that `react-native link` removes leading 0s on
    const numericLines = [
      'LastSwiftMigration',
      'LastUpgradeCheck',
      'LastSwiftMigration',
    ]
    const numericLinesWithoutLeadingZeros = pbxproj.filter(line =>
      numericLines.some(
        nline => line.startsWith(nline) && / [^0]\d*$/.test(line),
      ),
    )
    if (numericLinesWithoutLeadingZeros.length) {
      warn(
        'Some lines in the .pbxproj lost their leading 0s. Xcode likes to put them back, so we try to keep them around.',
      )
    }

    // Warn about duplicate entries in the linking paths after a `react-native link`
    const xcodeproj = await parseXcodeProject(pbxprojChanged)
    const buildConfig = xcodeproj.project.objects.XCBuildConfiguration
    const duplicateSearchPaths = Object.keys(buildConfig)
      .filter(key => typeof buildConfig[key] === 'object')
      .filter(key => {
        const value = buildConfig[key]
        const searchPaths = value.buildSettings.LIBRARY_SEARCH_PATHS
        return uniq(searchPaths).length === searchPaths.length
      })
    if (duplicateSearchPaths.length) {
      fail(
        'Some of the Xcode <code>LIBRARY_SEARCH_PATHS</code> now have duplicate entries. Please remove the duplicates. Thanks!',
      )
    }

    // Warn about non-sorted frameworks in the linking phase of the build
    const frameworksPhase = xcodeproj.project.objects.PBXFrameworksBuildPhase
    const alphabeticalFrameworkSorting = Object.keys(frameworksPhase)
      .filter(key => typeof frameworksPhase[key] === 'object')
      .filter(key => {
        const value = frameworksPhase[key]
        const files = value.files
          .map(file => file.comment)
          .filter(frameworkName => /^lib[A-Z]/.test(frameworkName))
        const sorted = [...files].sort((a, b) => a.localeSort(b))
        return isEqual(files, sorted)
      })
    if (alphabeticalFrameworkSorting.length) {
      warn(
        "Some of the iOS frameworks aren't sorted alphabetically in the linking phase. Please sort them alphabetically. Thanks!",
      )
    }

    // Warn about non-sorted frameworks in xcode sidebar
    const projectsInSidebar = xcodeproj.project.objects.PBXGroup
    const sidebarSorting = Object.keys(projectsInSidebar)
      .filter(key => typeof projectsInSidebar[key] === 'object')
      .filter(key => projectsInSidebar[key].name === 'Libraries')
      .filter(key => {
        const value = projectsInSidebar[key]
        const projects = value.files.map(file => file.comment)
        const sorted = [...projects].sort((a, b) => a.localeSort(b))
        return isEqual(projects, sorted)
      })
    if (sidebarSorting.length) {
      warn(
        "Some of the iOS frameworks aren't sorted alphabetically in the Xcode sidebar (under Libraries). Please sort them alphabetically. Thanks!",
      )
    }
  }

  //
  // Make sure the Info.plist `NSLocationWhenInUseUsageDescription` didn't switch to entities
  //
  const infoPlistChanged = danger.git.modified_files.find(filepath =>
    filepath.endsWith('Info.plist'),
  )
  if (infoPlistChanged) {
    const parsed = plist.parse(readFileSync(infoPlistChanged, 'utf-8'))
    const descKeysWithEntities = Object.keys(parsed)
      .filter(key => key.endsWith('Description'))
      .filter(key => parsed[key].includes("'")) // look for single quotes
    if (descKeysWithEntities.length) {
      const codedKeys = descKeysWithEntities.map(k => `<code>${k}</code>`)
      const keyNames = danger.utils.sentence(codedKeys)
      warn(
        `Some Info.plist descriptions were rewritten by something to include single quotes (${keyNames}). Xcode will rewrite them to use the <code>&amp;apos;</code> XML entity; would you please change them for us, so that Xcode doesn't have to?`,
      )
    }
  }
}

function runGreenkeeper() {
  message('greenkeeper ran')
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
var m = {
  code(attrs, ...children) {
    return (
      '```' + (attrs.language || '') + '\n' + children.join('\n') + '\n' + '```'
    )
  },
}

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
  return message(
    h.details(h.summary(name), '', m.code({language: lang}, log), '\n'),
  )
}

function parseXcodeProject(pbxprojPath) {
  const project = xcode.project(pbxprojPath)
  return new Promise((resolve, reject) => {
    // I think this can be called twice from .parse, which is an error for a Promise
    let resolved = false
    project.parse((error, data) => {
      if (resolved) {
        return
      }
      resolved = true
      if (error) {
        reject(error)
      }
      resolve(data)
    })
  })
}

//
// Invoke the script
//

schedule(main)
