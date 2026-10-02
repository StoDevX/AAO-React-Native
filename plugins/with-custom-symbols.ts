import {cpSync, existsSync, readdirSync} from 'node:fs'
import {join} from 'node:path'

import {withDangerousMod} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'

/** Where the tracked symbol sets live, relative to the repository root. */
const SOURCE_DIR = 'assets/symbols'

/**
 * Copy each custom SF Symbol's `.symbolset` into the app's asset catalog,
 * where `Image`'s `assetName` finds it by the set's name.
 */
export function copySymbolSets(projectRoot: string, catalog: string): void {
	// Copying into a missing catalog would create a folder Xcode never compiles,
	// and every custom symbol would draw as nothing.
	if (!existsSync(catalog)) {
		throw new Error(`with-custom-symbols: there is no asset catalog at ${catalog}.`)
	}

	let source = join(projectRoot, SOURCE_DIR)
	for (let entry of readdirSync(source)) {
		if (entry.endsWith('.symbolset')) {
			cpSync(join(source, entry), join(catalog, entry), {recursive: true})
		}
	}
}

const withCustomSymbols: ConfigPlugin = (config) =>
	withDangerousMod(config, [
		'ios',
		(mod) => {
			let {projectRoot, platformProjectRoot, projectName} = mod.modRequest
			copySymbolSets(
				projectRoot,
				join(platformProjectRoot, projectName as string, 'Images.xcassets'),
			)
			return mod
		},
	])

export default withCustomSymbols
