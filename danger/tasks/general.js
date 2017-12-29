const {danger, warn} = require('danger')
const {readFile} = require('../lib.js')

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
    warn(`An <code>only</code> was left in ${file} – no other tests can run.`),
  )

//
// Warn when PR size is large (mainly for hawken)
//
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
