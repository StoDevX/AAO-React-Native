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

/**
 * android/sentry.properties with `cli.executable` set to `binary`, or as it
 * was when there is none.
 *
 * Gradle's source-map upload (@sentry/react-native's sentry.gradle.kts) runs
 * `cli.executable` itself, not through node, and falls back to the npm
 * @sentry/cli that pnpm-workspace.yaml drops, so a release build that uploads
 * needs a native binary named here. It takes SENTRY_CLI_BINARY, the variable
 * that already names the native binary on iOS, because SENTRY_CLI_EXECUTABLE
 * there names a script node runs. The Sentry Android Gradle plugin reads the
 * same property for the ProGuard mapping upload.
 */
export function withCliExecutableProperty(properties: string, binary: string | undefined): string {
	if (!binary) {
		return properties
	}
	// A backslash starts an escape in a .properties file.
	let line = `cli.executable=${binary.replaceAll('\\', '\\\\')}`
	let kept = properties.split('\n').filter((each) => !each.startsWith('cli.executable='))
	let body = kept.join('\n').replace(/\n*$/u, '')
	return `${body}\n${line}\n`
}

const withSentryCliExecutable: ConfigPlugin = (config) => {
	config = withDangerousMod(config, [
		'ios',
		(mod) => {
			let path = join(mod.modRequest.platformProjectRoot, '.xcode.env')
			writeFileSync(path, defaultSentryCliExecutable(readFileSync(path, 'utf8')))
			return mod
		},
	])
	// Listed above @sentry/react-native/expo in app.config.ts, so this runs
	// after it has written the file.
	return withDangerousMod(config, [
		'android',
		(mod) => {
			let path = join(mod.modRequest.platformProjectRoot, 'sentry.properties')
			let properties = readFileSync(path, 'utf8')
			writeFileSync(path, withCliExecutableProperty(properties, process.env.SENTRY_CLI_BINARY))
			return mod
		},
	])
}

export default withSentryCliExecutable
