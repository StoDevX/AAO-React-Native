import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {withDangerousMod} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'

/**
 * Have the Release bundle phase drop exports nothing imports.
 *
 * Expo's CLI reads both variables when it bundles for production, and tree
 * shaking needs the graph optimisation, so each is set. They only act on a
 * production bundle: Debug builds skip bundling. `mise run bundle:ios` and
 * `mise run size-report` set the same two, so the size report measures what
 * ships.
 */
const TREE_SHAKING = [
	'',
	'# Drops unused exports from the production bundle; see plugins/with-tree-shaking.ts.',
	'export EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1',
	'export EXPO_UNSTABLE_TREE_SHAKING=1',
	'',
].join('\n')

/** The .xcode.env text with tree shaking turned on, once. */
export function enableTreeShaking(xcodeEnv: string): string {
	return xcodeEnv.includes('EXPO_UNSTABLE_TREE_SHAKING') ? xcodeEnv : `${xcodeEnv}${TREE_SHAKING}`
}

const withTreeShaking: ConfigPlugin = (config) =>
	withDangerousMod(config, [
		'ios',
		(mod) => {
			let path = join(mod.modRequest.platformProjectRoot, '.xcode.env')
			writeFileSync(path, enableTreeShaking(readFileSync(path, 'utf8')))
			return mod
		},
	])

export default withTreeShaking
