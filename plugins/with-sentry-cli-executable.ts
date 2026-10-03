import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {withDangerousMod} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'

/**
 * Point SENTRY_CLI_EXECUTABLE at ios_scripts/sentry-cli.cjs unless the build
 * environment already names one, as Xcode Cloud does in .xcode.env.local.
 *
 * Sentry's bundle and dSYM phases run `node "$SENTRY_CLI_EXECUTABLE" …`. The
 * npm @sentry/cli they would otherwise find is dropped in pnpm-workspace.yaml,
 * so without this the path is empty and they run `node ""`, which reads an
 * empty stdin and exits 0: a Release build ships no JS bundle and uploads no
 * dSYMs, and reports success. With the shim in place, a build that has no
 * SENTRY_CLI_BINARY fails in it instead.
 */
const DEFAULT_CLI = [
	'',
	"# Sentry's build phases run this with node; see plugins/with-sentry-cli-executable.ts.",
	'export SENTRY_CLI_EXECUTABLE="${SENTRY_CLI_EXECUTABLE:-$PROJECT_DIR/../ios_scripts/sentry-cli.cjs}"',
	'',
].join('\n')

/** The .xcode.env text with the default added, once. */
export function defaultSentryCliExecutable(xcodeEnv: string): string {
	return xcodeEnv.includes('SENTRY_CLI_EXECUTABLE') ? xcodeEnv : `${xcodeEnv}${DEFAULT_CLI}`
}

const withSentryCliExecutable: ConfigPlugin = (config) =>
	withDangerousMod(config, [
		'ios',
		(mod) => {
			let path = join(mod.modRequest.platformProjectRoot, '.xcode.env')
			writeFileSync(path, defaultSentryCliExecutable(readFileSync(path, 'utf8')))
			return mod
		},
	])

export default withSentryCliExecutable
