// @flow

// danger (removed by danger)
import {danger, schedule, markdown, warn, fail} from 'danger'

// danger plugins
import yarn from 'danger-plugin-yarn'

// utilities
import uniq from 'lodash/uniq'
import isEqual from 'lodash/isEqual'
import findIndex from 'lodash/findIndex'
import plist from 'simple-plist'

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
  const logFile = readLogFile('./logs/build').split('\n')
  const buildStatus = readLogFile('./logs/build-status')

  if (buildStatus !== '0') {
    fastlaneBuildLogTail(logFile, 'Android Build Failed')
    // returning early here because if the build fails, there's nothing to analyze
    return
  }

/*
  const appPaths = readJsonLogFile('./logs/products')
  const apkInfos = appPaths.map(listZip)

  markdown(
    h.details(
      h.summary('contents of <code>apkInfos</code>'),
      m.json(apkInfos),
      m.json(appPaths),
    ),
  )

  markdown(`Generated ${apkInfos.length} APK${apkInfos.length !== 1 ? 's' : ''}

${outputFilesInfo
    .map((filename, i) => [filename, apkInfos[i]])
    .map(([filename, apk]) =>
      h.details(
        h.summary(`${filename} (${bytes(apk.size)})`),
        m.json(apk),
      ),
    )}
  `)
*/
}

//
// task=IOS
//

function runiOS() {
  const logFile = readLogFile('./logs/build').split('\n')
  const buildStatus = readLogFile('./logs/build-status')

  if (buildStatus !== '0') {
    // returning early here because if the build fails, there's nothing to analyze
    fastlaneBuildLogTail(logFile, 'iOS Build Failed')
    return
  }

  // ideas:
  // - tee the "fastlane" output to a log, and run the analysis script
  //   to report back the longest compilation units
  //   (maybe only on react-native / package.json changes?)
  const analysisFile = readFile('./logs/analysis')
  markdown(
    h.details(
      h.summary('Analysis of slow build times (>20s)'),
      m.code({}, analysisFile),
    ),
  )

/*
  // - report the .ipa size
  // - report the .ipa file list
  const appPaths = readJsonLogFile('./logs/products')

  appPaths.forEach(appPath => {
    const info = listDirectoryTree(appPath)
    markdown(`## <code>.app</code>
Total <code>.app</code> size: ${info.size}

${h.details(h.summary('.app contents'), m.json(info))}
`)
  })
*/
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
  await xcodeproj()
  await gradle()
  await infoPlist()
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

// Remind us to check the xcodeproj, if it's changed
async function xcodeproj() {
  const pbxprojChanged = danger.git.modified_files.find(filepath =>
    filepath.endsWith('project.pbxproj'),
  )

  if (!pbxprojChanged) {
    return
  }

  warn('The Xcode project file changed. Maintainers, double-check the changes!')

  await pbxprojBlankLine()
  await pbxprojLeadingZeros()
  await pbxprojDuplicateLinkingPaths()
  await pbxprojSidebarSorting()
}

// Warn about a blank line that Xcode will re-insert if we remove
function pbxprojBlankLine() {
  const pbxprojPath = danger.git.modified_files.find(filepath =>
    filepath.endsWith('project.pbxproj'),
  )
  const pbxproj = readFile(pbxprojPath).split('\n')

  if (pbxproj[7] === '') {
    return
  }

  warn('Line 8 of the .pbxproj must be an empty line to match Xcode')
}

// Warn about numbers that `react-native link` removes leading 0s on
function pbxprojLeadingZeros() {
  const pbxprojPath = danger.git.modified_files.find(filepath =>
    filepath.endsWith('project.pbxproj'),
  )
  const pbxproj = readFile(pbxprojPath).split('\n')

  const numericLineNames = [
    /^\s+LastSwiftUpdateCheck\s/,
    /^\s+LastUpgradeCheck\s/,
    /^\s+LastSwiftMigration\s/,
  ]
  const isLineWithoutLeadingZero = line =>
    numericLineNames.some(nline => nline.test(line) && / [^0]\d+;$/.test(line))

  const numericLinesWithoutLeadingZeros = pbxproj
    .filter(isLineWithoutLeadingZero)
    .map(line => line.trim())

  if (!numericLinesWithoutLeadingZeros.length) {
    return
  }

  warn(
    h.details(
      h.summary('Some lines in the .pbxproj lost their leading 0s.'),
      h.p('Xcode likes to put them back, so we try to keep them around.'),
      h.ul(...numericLinesWithoutLeadingZeros.map(line => h.li(h.code(line)))),
    ),
  )
}

// Warn about duplicate entries in the linking paths after a `react-native link`
async function pbxprojDuplicateLinkingPaths() {
  const pbxprojPath = danger.git.modified_files.find(filepath =>
    filepath.endsWith('project.pbxproj'),
  )
  const xcodeproj = await parseXcodeProject(pbxprojPath)

  const buildConfig = xcodeproj.project.objects.XCBuildConfiguration
  const duplicateSearchPaths = Object.entries(buildConfig)
    .filter(([_, val] /*: [string, any]*/) => typeof val === 'object')
    .filter(
      ([_, val] /*: [string, any]*/) => val.buildSettings.LIBRARY_SEARCH_PATHS,
    )
    .filter(([_, val] /*: [string, any]*/) => {
      const searchPaths = val.buildSettings.LIBRARY_SEARCH_PATHS
      return uniq(searchPaths).length !== searchPaths.length
    })

  if (!duplicateSearchPaths.length) {
    return
  }

  fail(
    h.details(
      h.summary(
        'Some of the Xcode <code>LIBRARY_SEARCH_PATHS</code> have duplicate entries. Please remove the duplicates. Thanks!',
      ),
      h.p(
        'This is easiest to do by editing the project.pbxproj directly, IMHO. These keys all live under the <code>XCBuildConfiguration</code> section.',
      ),
      h.ul(...duplicateSearchPaths.map(([key]) => h.li(h.code(key)))),
    ),
  )
}

// Warn about non-sorted frameworks in xcode sidebar
async function pbxprojSidebarSorting() {
  const pbxprojPath = danger.git.modified_files.find(filepath =>
    filepath.endsWith('project.pbxproj'),
  )
  const xcodeproj = await parseXcodeProject(pbxprojPath)

  const projectsInSidebar = xcodeproj.project.objects.PBXGroup
  const sidebarSorting = Object.entries(projectsInSidebar)
    .filter(([_, val] /*: [string, any]*/) => typeof val === 'object')
    .filter(([_, val] /*: [string, any]*/) => val.name === 'Libraries')
    .filter(([_, val] /*: [string, any]*/) => val.files)
    .filter(([_, val] /*: [string, any]*/) => {
      const projects = val.files.map(file => file.comment)
      const sorted = [...projects].sort((a, b) => a.localeSort(b))
      return !isEqual(projects, sorted)
    })

  if (sidebarSorting.length) {
    return
  }

  warn(
    h.details(
      h.summary(
        "Some of the iOS frameworks aren't sorted alphabetically in the Xcode sidebar (under Libraries). Please sort them alphabetically. Thanks!",
      ),
      "If you right-click on the Libraries group in the sidebar, you can just pick 'Sort by Name' and Xcode will do it for you.",
    ),
  )
}

// Make sure the Info.plist `NSLocationWhenInUseUsageDescription` didn't switch to entities
function infoPlist() {
  const infoPlistChanged = danger.git.modified_files.find(filepath =>
    filepath.endsWith('Info.plist'),
  )
  if (!infoPlistChanged) {
    return
  }

  const parsed = plist.parse(readFile(infoPlistChanged))
  const descKeysWithEntities = Object.keys(parsed)
    .filter(key => key.endsWith('Description'))
    .filter(key => parsed[key].includes("'")) // look for single quotes

  if (!descKeysWithEntities.length) {
    return
  }

  warn(
    h.details(
      h.summary(
        'Some Info.plist descriptions were rewritten by something to include single quotes.',
      ),
      h.p(
        "Xcode will rewrite them to use the <code>&amp;apos;</code> XML entity; would you please change them for us, so that Xcode doesn't have to?",
      ),
      h.ul(
        ...descKeysWithEntities.map(key => {
          const val = entities.encode(parsed[key])
          const escaped = entities.encode(val.replace(/'/g, '&apos;'))
          return h.li(
            h.p(h.code(key) + ':'),
            h.blockquote(val),
            h.p('should become'),
            h.blockquote(escaped),
          )
        }),
      ),
    ),
  )
}

async function gradle() {
  await buildDotGradle()
  await mainDotJava()
  await settingsDotGradleSpacing()
}

// Ensure that the build.gradle dependencies list is sorted
function buildDotGradle() {
  const buildDotGradle = danger.git.modified_files.find(
    filepath => filepath === 'android/app/build.gradle',
  )
  if (!buildDotGradle) {
    return
  }

  const file = readFile(buildDotGradle).split('\n')
  const startLine = findIndex(file, line => line === 'dependencies {')
  const endLine = findIndex(file, line => line === '}', startLine)

  const linesToSort = file
    .slice(startLine + 1, endLine - 1)
    .map(line => line.trim())
    .filter(line => !line.startsWith('//'))

  const sorted = [...linesToSort].sort()

  if (isEqual(linesToSort, sorted)) {
    return
  }

  const firstEntry = linesToSort[0]
  warn(
    h.details(
      h.summary(
        "We like to keep the <code>build.gradle</code>'s list of dependencies sorted alphabetically.",
      ),
      h.p(`Was the first entry, <code>${firstEntry}</code>, out of place?`),
    ),
  )
}

// Ensure that the MainApplication.java imports list is sorted
function mainDotJava() {
  const mainDotJava = danger.git.modified_files.find(filepath =>
    filepath.endsWith('MainApplication.java'),
  )
  if (!mainDotJava) {
    return
  }

  const file = readFile(mainDotJava).split('\n')
  const startNeedle = '// keep these sorted alphabetically'
  const startLine = findIndex(file, line => line === startNeedle)
  const endLine = findIndex(file, line => line === '', startLine)

  const linesToSort = file
    .slice(startLine + 1, endLine - 1)
    .map(line => line.trim())

  const sorted = [...linesToSort].sort()

  if (isEqual(linesToSort, sorted)) {
    return
  }

  // react-native link inserts the new import right after the RN import
  const rnImportLine = findIndex(
    file,
    line => line === 'import com.facebook.react.ReactApplication;',
  )
  const problemEntry = file[rnImportLine + 1]
  const problemLine = rnImportLine - startLine + 1
  warn(
    h.details(
      h.summary(
        "We like to keep the <code>MainApplication.java</code>'s list of imports sorted alphabetically.",
      ),
      h.p(
        `Was the number ${problemLine} entry, <code>${problemEntry}</code>, out of place?`,
      ),
    ),
  )
}

// Enforce spacing in the settings.gradle file
function settingsDotGradleSpacing() {
  const settingsDotGradle = danger.git.modified_files.find(
    filepath => filepath === 'android/settings.gradle',
  )
  if (!settingsDotGradle) {
    return
  }

  const file = readFile(settingsDotGradle).split('\n')
  const startLine = findIndex(file, line => line.startsWith('//'))
  const firstInclusionLine = findIndex(file, line => line.startsWith('include'))

  if (firstInclusionLine >= startLine) {
    return
  }

  const firstEntry = file[firstInclusionLine]
  warn(
    h.details(
      h.summary(
        "We like to keep the <code>settings.gradle</code>'s list of imports sorted alphabetically.",
      ),
      h.p(
        `It looks like the first entry, <code>${firstEntry}</code>, is out of place.`,
      ),
    ),
  )
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
  const jestLog = readLogFile('./logs/jest')

  if (!jestLog) {
    return
  }

  if (!jestLog.includes('FAIL')) {
    return
  }

  const lines = getRelevantLinesJest(jestLog)

  fileLog('Some Jest tests failed. Take a peek?', lines.join('\n'))
}

function getRelevantLinesJest(logContents) {
  const file = logContents.split('\n')

  const startIndex = findIndex(
    file,
    l => l.trim() === 'Summary of all failing tests',
  )
  const endIndex = findIndex(
    file,
    l => l.trim() === 'Ran all test suites.',
    startIndex,
  )

  return file.slice(startIndex + 1, endIndex - 1)
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
import childProcess from 'child_process'
import stripAnsi from 'strip-ansi'
import directoryTree from 'directory-tree'
import xcode from 'xcode'
import util from 'util'

const execFile = util.promisify(childProcess.execFile)

const {XmlEntities} = require('html-entities')
export const entities = new XmlEntities()

export function fastlaneBuildLogTail(
  log /*: Array<string>*/,
  message /*: string*/,
) {
  const n = 150
  const logToPost = log
    .slice(-n)
    .map(stripAnsi)
    .join('\n')

  fail(
    h.details(
      h.summary(message),
      h.p(`Last ${n} lines`),
      m.code({}, logToPost),
    ),
  )
}

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

export function parseXcodeProject(
  pbxprojPath /*: string*/,
) /*: Promise<Object>*/ {
  return new Promise((resolve, reject) => {
    const project = xcode.project(pbxprojPath)
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

export async function listZip(filepath /*: string*/) {
  try {
    const {stdout} = await execFile('unzip', ['-l', filepath])
    const lines = stdout.split('\n')

    const parsed = lines.slice(3, -3).map(line => {
      const length = parseInt(line.slice(0, 9).trim(), 10)
      // const datetime = line.slice(12, 28)
      const filepath = line.slice(30).trim()
      const type = filepath.endsWith('/') ? 'folder' : 'file'
      return {size: length, filepath, type}
    })
    const zipSize = parsed.reduce((sum, current) => current.size + sum, 0)

    return {files: parsed, size: zipSize}
  } catch (err) {
    fail(
      h.details(
        h.summary(`Could not examine the ZIP file at <code>${filepath}</code>`),
        m.json(err),
      ),
    )
  }
}

export function listDirectory(dirpath /*: string*/) {
  try {
    return fs.readdirSync(dirpath)
  } catch (err) {
    fail(h.details(h.summary(`${h.code(dirpath)} does not exist`), m.json(err)))
    return []
  }
}

export function listDirectoryTree(dirpath /*: string*/) /*: any*/ {
  try {
    const exists = fs.accessSync(dirpath, fs.F_OK)

    if (!exists) {
      fail(
        h.details(
          h.summary(`Could not access <code>${dirpath}</code>`),
          m.code({}, listDirectory(dirpath).join('\n')),
        ),
      )
    }

    return directoryTree(dirpath)
  } catch (err) {
    fail(
      h.details(
        h.summary('<code>listDirectoryTree</code> threw an error'),
        m.json(err),
      ),
    )
    return {}
  }
}

//
// Run the file
//
schedule(main)
