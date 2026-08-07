import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {ConfigPlugin, withDangerousMod} from '@expo/config-plugins'

// Matched with tolerance for indentation, and the captured indentation is
// reused, so a reflowed Expo template does not break this.
const ANCHOR = /^([ \t]*)use_expo_modules!/mu

/**
 * Silence compiler warnings from pod sources.
 *
 * Around a hundred pods of third-party code, none of which we can fix, bury our
 * own warnings in the build log. Expo's Podfile template omits this and
 * `expo-build-properties` does not expose it, so the plugin adds it.
 */
export function inhibitPodWarnings(contents: string): string {
	if (contents.includes('inhibit_all_warnings!')) {
		return contents
	}

	let match = ANCHOR.exec(contents)
	if (!match) {
		throw new Error(
			'with-inhibit-pod-warnings: could not find `use_expo_modules!` in the Podfile. The Expo template moved it; update this plugin rather than silently letting pod warnings back in.',
		)
	}

	let [line, indent] = match
	return contents.replace(line, `${line}\n${indent}inhibit_all_warnings!`)
}

const withInhibitPodWarnings: ConfigPlugin = (config) =>
	withDangerousMod(config, [
		'ios',
		(mod) => {
			let podfile = join(mod.modRequest.platformProjectRoot, 'Podfile')
			writeFileSync(podfile, inhibitPodWarnings(readFileSync(podfile, 'utf8')))
			return mod
		},
	])

export default withInhibitPodWarnings
