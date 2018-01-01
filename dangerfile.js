// @flow

// danger removes this import, so don't do anything fancy with it
const {danger, schedule, warn, fail, markdown} = require('danger')

// it leaves the rest of the imports alone, though
const yarn = require('danger-plugin-yarn')
const {readFileSync} = require('fs')
const childProcess = require('child_process')
const uniq = require('lodash/uniq')
const isEqual = require('lodash/isEqual')
const findIndex = require('lodash/findIndex')
const bytes = require('pretty-bytes')
const {XmlEntities} = require('html-entities')
const directoryTree = require('directory-tree')
const util = require('util')
const execFile = util.promisify(childProcess.execFile)
const entities = new XmlEntities()

// depended on by react-native (and us)
const xcode = require('xcode')
// depended on by xcode (and us)
const plist = require('simple-plist')

//
// The entry point of this script
//

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
    case 'JS':
      await runGeneral()
      await yarn()
      break
    case 'JS-data':
      await runJSのData()
      await runJSのBusData()
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
// Individual Danger "tasks"
//

function runAndroid() {
  const logFile = readLogFile('./logs/android').split('\n')

  const infoTest = /\[\d{2}:\d{2}:\d{2}\]: Generated files/
  const infoLine = findIndex(logFile, line => infoTest.test(line)) + 1
  const outputFilesInfo = JSON.parse(logFile[infoLine].split(': ')[1])
  const apkInfos = outputFilesInfo.map(listZip)

  markdown(`Generated ${apkInfos.length} APK${apkInfos.length !== 1 ? 's' : ''}

${outputFilesInfo
    .map((filename, i) => [filename, apkInfos[i]])
    .map(([filename, apk]) =>
      h.details(
        h.summary(filename),
        '',
        m.code({language: 'json'}, JSON.stringify(apk, null, 2)),
      ),
    )}
  `)
}

function runiOS() {
  const logFile = readLogFile('./logs/ios').split('\n')

  // ideas:
  // - tee the "fastlane" output to a log, and run the analysis script
  //   to report back the longest compilation units
  //   (maybe only on react-native / package.json changes?)
  const analysisFile = readFile('./logs/analysis')
  markdown(
    h.details(h.summary('Analysis of slow build times'), h.pre(analysisFile)),
  )

  // - report the .ipa size
  // - report the .ipa file list
  const getFromGymLog = key =>
    (logFile.find(l => l.includes(key)) || '').split(' is ')[1].trim()
  const appFolder = getFromGymLog('XCBUILD_TARGET_BUILD_DIR')
  const appFile = getFromGymLog('GYM_OUTPUT_NAME')
  const appPath = `${appFolder}/${appFile}.app`

  if (appFolder && appFile) {
    const info = directoryTree(appPath) // synchronous method
    markdown(`## <code>.app</code>
Total <code>.app</code> size: ${bytes(info.size)}

${h.details(
      h.summary('.app contents'),
      m.code({language: 'json'}, JSON.stringify(info.children, null, 2)),
    )}`)
  } else {
    warn('Could not figure out path to .app folder')
  }
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
    warn(
      'Changes were made to <code>package.json</code>, but not to <code>yarn.lock</code>. Perhaps you need to run <code>yarn</code>?',
    )
  }

  //
  // Warn if tests have been enabled to the exclusion of all others
  //
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

  //
  // Warn when PR size is large (mainly for hawken)
  //
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

  //
  // Remind us to check the xcodeproj, if it's changed
  //
  const pbxprojChanged = danger.git.modified_files.find(filepath =>
    filepath.endsWith('project.pbxproj'),
  )
  if (pbxprojChanged) {
    warn(
      'The Xcode project file changed. Maintainers, double-check the changes!',
    )

    // Warn about a blank line that Xcode will re-insert if we remove
    const pbxproj = readFileSync(pbxprojChanged, 'utf-8').split('\n')
    if (pbxproj[7] !== '') {
      warn(
        "Line 8 of the .pbxproj must be an empty line to match Xcode's formatting",
      )
    }

    // Warn about numbers that `react-native link` removes leading 0s on
    const numericLineNames = [
      /^\s+LastSwiftUpdateCheck\s/,
      /^\s+LastUpgradeCheck\s/,
      /^\s+LastSwiftMigration\s/,
    ]
    const isLineWithoutLeadingZero = line =>
      numericLineNames.some(
        nline => nline.test(line) && / [^0]\d+;$/.test(line),
      )
    const numericLinesWithoutLeadingZeros = pbxproj
      .filter(isLineWithoutLeadingZero)
      .map(line => line.trim())

    if (numericLinesWithoutLeadingZeros.length) {
      warn(
        h.details(
          h.summary('Some lines in the .pbxproj lost their leading 0s.'),
          h.p('Xcode likes to put them back, so we try to keep them around.'),
          h.ul(
            ...numericLinesWithoutLeadingZeros.map(line => h.li(h.code(line))),
          ),
        ),
      )
    }

    // Warn about duplicate entries in the linking paths after a `react-native link`
    const xcodeproj = await parseXcodeProject(pbxprojChanged)
    const buildConfig = xcodeproj.project.objects.XCBuildConfiguration
    const duplicateSearchPaths = Object.entries(buildConfig)
      .filter(([_, val] /*: [string, any]*/) => typeof val === 'object')
      .filter(
        ([_, val] /*: [string, any]*/) =>
          val.buildSettings.LIBRARY_SEARCH_PATHS,
      )
      .filter(([_, val] /*: [string, any]*/) => {
        const searchPaths = val.buildSettings.LIBRARY_SEARCH_PATHS
        return uniq(searchPaths).length !== searchPaths.length
      })

    if (duplicateSearchPaths.length) {
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
      warn(
        h.details(
          h.summary(
            "Some of the iOS frameworks aren't sorted alphabetically in the Xcode sidebar (under Libraries). Please sort them alphabetically. Thanks!",
          ),
          "If you right-click on the Libraries group in the sidebar, you can just pick 'Sort by Name' and Xcode will do it for you.",
        ),
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
  }

  //
  // Ensure that the build.gradle dependencies list is sorted
  //
  const buildDotGradle = danger.git.modified_files.find(
    filepath => filepath === 'android/app/build.gradle',
  )
  if (buildDotGradle) {
    const file = readFileSync(buildDotGradle, 'utf-8').split('\n')
    const startLine = findIndex(file, line => line === 'dependencies {')
    const endLine = findIndex(file, line => line === '}', startLine)

    const linesToSort = file
      .slice(startLine + 1, endLine - 1)
      .map(line => line.trim())
      .filter(line => !line.startsWith('//'))

    const sorted = [...linesToSort].sort()

    if (!isEqual(linesToSort, sorted)) {
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
  }

  //
  // Ensure that the MainApplication.java imports list is sorted
  //
  const mainDotJava = danger.git.modified_files.find(filepath =>
    filepath.endsWith('MainApplication.java'),
  )
  if (mainDotJava) {
    const file = readFileSync(mainDotJava, 'utf-8').split('\n')
    const startNeedle = '// keep these sorted alphabetically'
    const startLine = findIndex(file, line => line === startNeedle)
    const endLine = findIndex(file, line => line === '', startLine)

    const linesToSort = file
      .slice(startLine + 1, endLine - 1)
      .map(line => line.trim())

    const sorted = [...linesToSort].sort()

    if (!isEqual(linesToSort, sorted)) {
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
  }

  //
  // Enforce spacing in the settings.gradle file
  //
  const settingsDotGradle = danger.git.modified_files.find(
    filepath => filepath === 'android/settings.gradle',
  )
  if (settingsDotGradle) {
    const file = readFileSync(settingsDotGradle, 'utf-8').split('\n')
    const startLine = findIndex(file, line => line.startsWith('//'))
    const firstInclusionLine = findIndex(file, line =>
      line.startsWith('include'),
    )

    if (firstInclusionLine < startLine) {
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
  }
}

function runGreenkeeper() {
  // message('greenkeeper ran')
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

  const file = jestLog.split('\n')
  const startIndex = findIndex(
    file,
    l => l.trim() === 'Summary of all failing tests',
  )
  const endIndex = findIndex(
    file,
    l => l.trim() === 'Ran all test suites.',
    startIndex,
  )

  const lines = file.slice(startIndex + 1, endIndex - 1)

  fileLog('Some Jest tests failed. Take a peek?', lines.join('\n'))
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
        if (!children.length) {
          return `<${property}>`
        }
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

function isBadDataValidationLog(log) {
  return log.split('\n').some(l => !l.endsWith('is valid'))
}

function fileLog(name, log, {lang = null} = {}) {
  return markdown(
    `## ${name}

${m.code({language: lang}, log)}`,
  )
}

function parseXcodeProject(pbxprojPath) {
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

async function listZip(filepath) {
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
}

//
// Invoke the script
//

schedule(main)
