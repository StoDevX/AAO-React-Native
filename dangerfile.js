// @flow

// danger (removed by danger)
const {danger, schedule, markdown, warn, fail} = require('danger')

// danger plugins
const {default: yarn} = require('danger-plugin-yarn')

// utilities
const findIndex = require('lodash/findIndex')

async function main() {
	const taskName = String(process.env.task)

	switch (taskName) {
		case 'ANDROID':
			await runAndroid()
			break
		case 'IOS':
			await runiOS()
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
		case 'JS-yarn-dedupe':
			await runJSのYarnDedupe()
			break
		case 'JS-bundle-android':
		case 'JS-bundle-ios':
			break
		default:
			warn(`Unknown task name "${taskName}"; Danger cannot report anything.`)
	}
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

	// we do not currently do any android analysis
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

	// tee the "fastlane" output to a log, and run the analysis script
	// to report back the longest compilation units
	const analysisFile = readFile('./logs/analysis')
	if (!analysisFile.trim().length) {
		return
	}

	markdown(
		h.h2('iOS Report'),
		h.details(
			h.summary('Analysis of slow build times (>20s)'),
			m.code({}, analysisFile),
		),
	)
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
	await changelogSync()
}

// New js files should have `@flow` at the top
function flowAnnotated() {
	let noFlow = danger.git.created_files
		.filter(path => path.endsWith('.js'))
		// except for those in /flow-typed
		.filter(filepath => !filepath.includes('flow-typed'))
		.filter(filepath => !readFile(filepath).includes('@flow'))

	if (!noFlow.length) {
		return
	}

	markdown(
		h.details(
			h.summary('There is no <code>@flow</code> annotation in these file(s)'),
			h.ul(...noFlow.map(file => h.li(h.code(file)))),
		),
	)
}

// Warn if tests have been enabled to the exclusion of all others
function exclusionaryTests() {
	let exclusionary = danger.git.created_files
		.filter(filepath => filepath.endsWith('.test.js'))
		.map(filepath => ({filepath, content: readFile(filepath)}))
		.filter(
			({content}) =>
				content.includes('it.only') || content.includes('describe.only'),
		)

	if (!exclusionary.length) {
		return
	}

	markdown(
		h.details(
			h.summary(
				'An <code>only</code> was left these file(s) – no other tests can run.',
			),
			h.ul(...exclusionaryTests.map(file => h.li(h.code(file)))),
		),
	)
}

// Warn when PR size is large (mainly for hawken)
function bigPr() {
	const bigPRThreshold = 400 // lines
	const thisPRSize = danger.github.pr.additions + danger.github.pr.deletions
	if (thisPRSize <= bigPRThreshold) {
		return
	}

	markdown(
		h.p(
			`Big PR! We like to try and keep PRs under ${bigPRThreshold} lines, and this one was ${thisPRSize} lines.`,
		),
		h.p(
			'If the PR contains multiple logical changes, splitting each change into a separate PR will allow a faster, easier, and more thorough review.',
		),
	)
}

// Remind us to check the xcodeproj, if it's changed
function xcodeproj() {
	const pbxprojChanged = danger.git.modified_files.find(filepath =>
		filepath.endsWith('project.pbxproj'),
	)

	if (!pbxprojChanged) {
		return
	}

	markdown(
		'The Xcode project file changed. Maintainers, double-check the changes!',
	)
}

function changelogSync() {
	const noteworthyFolder = /^(\.circleci|\.github|android|e2e|fastlane|ios|modules|scripts|source)\//gu
	const noteworthyFiles = new Set([
		'.babelrc',
		'.eslintignore',
		'.eslintrc.yaml',
		'.flowconfig',
		'.gitattributes',
		'.gitignore',
		'.prettierignore',
		'.prettierrc.yaml',
		'.rubocop.yml',
		'.travis.yml',
		'babel.config.js',
		'Brewfile',
		'Gemfile',
		'index.js',
	])
	const definitelyNotNoteworthy = /package\.json|yarn\.lock/gu

	const changedSourceFiles = danger.git.modified_files.filter(file => {
		let noteworthy = noteworthyFolder.test(file) || noteworthyFiles.has(file)
		let excluded = definitelyNotNoteworthy.test(file)

		return noteworthy && !excluded
	})

	if (!changedSourceFiles.length) {
		return
	}

	const changedChangelog = danger.git.modified_files.includes('CHANGELOG.md')

	if (!changedChangelog) {
		markdown(
			h.details(
				h.summary(
					'This PR modified important files but does not have any changes to the CHANGELOG.',
				),
				h.ul(...changedSourceFiles.map(file => h.li(h.code(file)))),
			),
		)
	}
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

	fileLog('ESLint had a thing to say!', eslintLog)
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

function runJSのYarnDedupe() {
	const yarnDedupeLog = readLogFile('./logs/yarn-dedupe')

	if (!yarnDedupeLog) {
		return
	}

	fileLog('yarn dedupe made some changes', yarnDedupeLog, {lang: 'diff'})
}

//
// Utilities
//

const fs = require('fs')
const stripAnsi = require('strip-ansi')

function fastlaneBuildLogTail(log /*: Array<string>*/, message /*: string*/) {
	const n = 150
	const logToPost = log
		.slice(-n)
		.map(stripAnsi)
		.join('\n')

	markdown(
		h.details(
			h.summary(message),
			h.p(`Last ${n} lines`),
			m.code({}, logToPost),
		),
	)
}

const h /*: any*/ = new Proxy(
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

const m = {
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

function readFile(filename /*: string*/) {
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

function readLogFile(filename /*: string*/) {
	return readFile(filename).trim()
}

function isBadDataValidationLog(log /*: string*/) {
	return log.split('\n').some(l => !l.endsWith('is valid'))
}

function fileLog(
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
