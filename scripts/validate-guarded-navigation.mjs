import {globSync, readFileSync} from 'node:fs'

/**
 * `router.back()` pops whatever is behind it, every time it is called. It
 * carries no guard, so a second press of a close button — which a lagging
 * screen invites — pops the screen behind the one being closed. On a sheet
 * that means landing on the home screen instead of where you were.
 *
 * `navigation.goBack()` is a no-op once there is nothing left to pop, so the
 * extra press costs nothing.
 */
const BANNED = /\brouter\s*\.\s*back\s*\(/u

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
		console.log(`error: ${file}:${line} calls router.back()`)
		console.log(`       ${text}`)
	}

	if (offenders.length > 0) {
		console.log('')
		console.log('router.back() pops every time it is called, so a second press of a')
		console.log('close button takes the screen behind it too. Use the navigation')
		console.log('object instead:')
		console.log('')
		console.log("  import {useNavigation} from 'expo-router'")
		console.log('  let navigation = useNavigation()')
		console.log('  navigation.goBack()')
		console.log('')
		console.log('goBack() is a no-op once there is nothing left to pop.')
		process.exit(1)
	}
}
