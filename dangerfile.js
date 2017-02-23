import { danger, fail, warn, markdown } from 'danger'
import { readFileSync } from 'fs'

const jsFiles = danger.git.created_files.filter(path => path.endsWith('js'))

// new js files should have `@flow` at the top
const unFlowedFiles = jsFiles.filter(filepath => {
  const content = readFileSync(filepath, 'utf-8')
  return !content.includes('@flow')
})

if (unFlowedFiles.length > 0) {
  warn(`These new JS files do not have Flow enabled: ${unFlowedFiles.join(', ')}`)
}

// revisit this when we move to yarn
// const packageChanged = danger.git.modified_files.includes('package.json')
// const lockfileChanged = danger.git.modified_files.includes('yarn.lock')
// if (packageChanged && !lockfileChanged) {
//   const message = 'Changes were made to package.json, but not to yarn.lock'
//   const idea = 'Perhaps you need to run <code>yarn install</code>?'
//   warn(`${message} - <i>${idea}</i>`)
// }

// Be careful of leaving testing shortcuts in the codebase
const jsTests = jsFiles.filter(filepath => filepath.endsWith('test.js'))
jsTests.forEach(file => {
  const content = readFileSync(file, 'utf-8')
  if (content.includes('it.only') || content.includes('describe.only')) {
    fail(`An <code>only</code> was left in ${file} – that prevents any other tests from running.`)
  }
})

// Warn when PR size is large (mainly for hawken)
const bigPRThreshold = 400
const thisPRSize = danger.github.pr.additions + danger.github.pr.deletions
if (thisPRSize > bigPRThreshold) {
  warn(':exclamation: Big PR!')
  markdown(`> The Pull Request size is a bit big. We like to try and keep PRs under ${bigPRThreshold} lines per PR, and this one was ${thisPRSize} lines. If the PR contains multiple logical changes, splitting each into separate PRs will allow a faster, easier, and more thorough review.`)
}


//
// Check for and report errors from our tools
//

const codeBlock = (contents, lang=null) => markdown(`\`\`\`${lang || ''}\n${contents}\n\`\`\``)

// Eslint
const eslintLog = readFileSync('logs/eslint', 'utf-8').trim()
const dataValidationLog = readFileSync('logs/validate-data', 'utf-8').trim()
const dataBundlingStatusLog = readFileSync('logs/bundle-data', 'utf-8').trim()
const flowLog = readFileSync('logs/flow', 'utf-8').trim()
const iosJsBundleLog = readFileSync('logs/bundle-ios', 'utf-8').trim()
const androidJsBundleLog = readFileSync('logs/bundle-android', 'utf-8').trim()
const jestLog = readFileSync('logs/jest', 'utf-8').trim()

if (eslintLog) {
  warn('Eslint had a thing to say!')
  codeBlock(eslintLog)
}

if (dataValidationLog && dataValidationLog.split('\n').some(l => !l.endsWith("is valid"))) {
  warn("Something's up with the data.")
  codeBlock(dataValidationLog)
}

if (dataBundlingStatusLog) {
  fail("The data changed when it was re-bundled. You'll need to bundle it manually.")
  codeBlock(dataBundlingStatusLog)
}

if (flowLog !== 'Found 0 errors') {
  warn('Flow would like to interject about types…')
  codeBlock(flowLog)
}

if (iosJsBundleLog) {
  warn('The iOS bundle ran into an issue.')
  codeBlock(iosJsBundleLog)
}

if (androidJsBundleLog) {
  warn('The Android bundle ran into an issue.')
  codeBlock(androidJsBundleLog)
}

if (!jestLog.split('\n')[0].startsWith('----------')) {
  warn('Some Jest tests failed. Take a peek?')
  codeBlock(jestLog)
}
