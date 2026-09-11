import {globSync, readFileSync} from 'node:fs'

/**
 * Going back has one sanctioned call in this app: `navigation.goBack()`. It is
 * a no-op once there is nothing left to pop, so a second press of a close
 * button -- which a lagging screen invites -- costs nothing.
 *
 * Every other route off a screen pops unconditionally. `router.back()` takes
 * the screen behind the one being closed, which on a sheet means landing on
 * the home screen. `dismiss`, `dismissAll` and `dismissTo` have the same
 * shape, and `navigation.pop` family likewise.
 *
 * The point is not that each of these is wrong everywhere -- it is that one
 * call being the only reachable one is what keeps this from needing a test per
 * screen. If a case ever genuinely needs another, add it here with the reason
 * rather than reaching for it in a component.
 */
const BANNED =
	/\b(?:router\s*\.\s*(?:back|goBack|dismiss|dismissAll|dismissTo)|navigation\s*\.\s*(?:pop|popTo|popToTop))\s*\(/u

/** The source roots a route or component can live in. */
const ROOTS = [
	'app/**/*.tsx',
	'app/**/*.ts',
	'source/**/*.tsx',
	'source/**/*.ts',
	'modules/**/*.tsx',
	'modules/**/*.ts',
]

/** Every offending line, as `{file, line, text}`. */
export function findUnguardedBack(files) {
	let found = []

	for (let {path, contents} of files) {
		contents.split('\n').forEach((text, index) => {
			if (BANNED.test(text)) {
				found.push({file: path, line: index + 1, text: text.trim()})
			}
		})
	}

	return found.sort((one, two) => one.file.localeCompare(two.file) || one.line - two.line)
}

function readSources() {
	return ROOTS.flatMap((pattern) =>
		globSync(pattern, {exclude: (p) => p.includes('node_modules')}),
	).map((path) => ({path, contents: readFileSync(path, 'utf8')}))
}

// Only run the check when invoked directly, so the test can import the pure part.
if (import.meta.url === `file://${process.argv[1]}`) {
	let offenders = findUnguardedBack(readSources())

	for (let {file, line, text} of offenders) {
		console.log(`error: ${file}:${line} navigates back some way other than navigation.goBack()`)
		console.log(`       ${text}`)
	}

	if (offenders.length > 0) {
		console.log('')
		console.log('These all pop unconditionally, so a second press of a close button')
		console.log('takes the screen behind it too. Use the navigation object instead:')
		console.log('')
		console.log("  import {useNavigation} from 'expo-router'")
		console.log('  let navigation = useNavigation()')
		console.log('  navigation.goBack()')
		console.log('')
		console.log('goBack() is a no-op once there is nothing left to pop.')
		process.exit(1)
	}
}
