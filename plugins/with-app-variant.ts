import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {withDangerousMod} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'

/** Marks the line this plugin owns, so a second prebuild replaces it. */
const MARKER = '# The app ios/ was prebuilt as; see plugins/with-app-variant.ts.'

/**
 * The .xcode.env text naming `variant` as the build's APP_VARIANT.
 *
 * app.config.ts requires APP_VARIANT, and Xcode's build phases read it too:
 * expo-constants writes the app's config into the bundle, and a Release build
 * bundles the JavaScript. ios/ holds the one app it was prebuilt as, so every
 * build of it, Xcode's own included, takes that app's variant, whatever the
 * build's environment says.
 */
export function rememberAppVariant(xcodeEnv: string, variant: string): string {
	let kept = xcodeEnv
		.split('\n')
		.filter((line) => line !== MARKER && !line.startsWith('export APP_VARIANT='))
		.join('\n')
	return `${kept}${kept.endsWith('\n') ? '' : '\n'}\n${MARKER}\nexport APP_VARIANT=${variant}\n`
}

const withAppVariant: ConfigPlugin<{variant: string}> = (config, {variant}) =>
	withDangerousMod(config, [
		'ios',
		(mod) => {
			let path = join(mod.modRequest.platformProjectRoot, '.xcode.env')
			writeFileSync(path, rememberAppVariant(readFileSync(path, 'utf8'), variant))
			return mod
		},
	])

export default withAppVariant
