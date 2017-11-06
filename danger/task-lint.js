// @flow

import yarn from 'danger-plugin-yarn'
import * as lib from './lib.js'


//
// new js files should have `@flow` at the top
//

danger.git.created_files
  .filter(path => path.endsWith('.js'))
  .filter(filepath => {
    const content = lib.readFile(filepath)
    return !content.includes('@flow')
  })
  .forEach(file => danger.warn(`<code>${file}</code> has no <code>@flow</code> annotation!`))


//
// ensure that package.lock changes include yarn.lock changes
// - Provides a 🎉 when there's a package version bump.
// - Provides npmjs.com and yarn why metadata about new dependencies.
// - Will warn you when there are dependencies or devDependencies changes without a yarn.lock change.
//

danger.schedule(yarn())


//
// Be careful of leaving testing shortcuts in the codebase
//

;[...danger.git.created_files, ...danger.git.modified_files]
  .filter(filepath => filepath.endsWith('test.js'))
  .filter(filepath => {
    const content = lib.readFile(filepath)
    return content.includes('.only()')
  })
  .forEach(f => danger.warn(`There's an <code>only</code> in ${f} – no other tests can run.`))


//
// Warn when PR size is large (mainly for hawken)
//

const bigPRThreshold = 400 // lines
const thisPRSize = danger.github.pr.additions + danger.github.pr.deletions
if (thisPRSize > bigPRThreshold) {
  danger.markdown(`
:exclamation: Big PR!

> We like to try and keep PRs under ${bigPRThreshold} lines, and this one was
> ${thisPRSize} lines. If the PR contains multiple logical changes, splitting
> each change into a separate PR will allow a faster, easier, and more
> thorough review.
`)
}


//
// Check for and report errors from our tools
//

const eslintLog = lib.readLogFile('logs/eslint')
if (eslintLog) {
  lib.logDetailsEl('Eslint had a thing to say!', eslintLog)
}

const prettierLog = lib.readLogFile('logs/prettier')
if (prettierLog) {
  lib.logDetailsEl('Prettier made some changes', prettierLog, {lang: 'diff'})
}
