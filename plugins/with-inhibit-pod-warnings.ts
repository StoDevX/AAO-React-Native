import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {ConfigPlugin, withDangerousMod} from '@expo/config-plugins'

const ANCHOR = '  use_expo_modules!'
const INHIBIT = '  inhibit_all_warnings!'

/**
 * Silence compiler warnings from pod sources.
 *
 * Around a hundred pods of third-party code, none of which we can fix, bury our
 * own warnings in the build log. Expo's Podfile template does not include this
 * and `expo-build-properties` does not expose it, so it is reapplied here.
 */
export function inhibitPodWarnings(contents: string): string {
	if (contents.includes('inhibit_all_warnings!')) {
		return contents
	}

	if (!contents.includes(ANCHOR)) {
		throw new Error(
			`with-inhibit-pod-warnings: could not find \`${ANCHOR.trim()}\` in the Podfile. The Expo template moved it; update this plugin rather than silently letting pod warnings back in.`,
		)
	}

	return contents.replace(ANCHOR, `${ANCHOR}\n${INHIBIT}`)
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
