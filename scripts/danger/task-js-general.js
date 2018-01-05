// @flow

import {danger, warn, fail} from 'danger'
import uniq from 'lodash/uniq'
import isEqual from 'lodash/isEqual'
import findIndex from 'lodash/findIndex'
import plist from 'simple-plist'
import {readFile, h, parseXcodeProject, entities} from './lib'

export default async function run() {
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
