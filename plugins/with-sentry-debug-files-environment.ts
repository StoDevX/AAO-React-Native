import {withXcodeProject} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'
import type {XcodeProject} from 'xcode'

const PHASE_NAME = 'Upload Debug Symbols to Sentry'

/**
 * Lines that load ios/.xcode.env and ios/.xcode.env.local, as React Native's
 * own bundle phase does. POSIX `[` and `.`, because the phase runs in /bin/sh.
 */
export const LOAD_XCODE_ENV = [
	'if [ -f "$PROJECT_DIR/.xcode.env" ]; then',
	'  . "$PROJECT_DIR/.xcode.env"',
	'fi',
	'if [ -f "$PROJECT_DIR/.xcode.env.local" ]; then',
	'  . "$PROJECT_DIR/.xcode.env.local"',
	'fi',
].join('\n')

/**
 * Load .xcode.env before Sentry's dSYM upload phase looks for node.
 *
 * The phase finds its script with `${NODE_BINARY:-node}` before anything has
 * loaded NODE_BINARY. Xcode Cloud has no node on a build phase's PATH, which is
 * why ci_post_clone.sh writes the path into .xcode.env.local, so as generated
 * the phase fails there and takes the archive with it. Loading the file first
 * also brings in the Sentry token and flags ci_post_clone.sh writes beside it.
 *
 * Sentry's plugin rewrites this phase on every prebuild, so this plugin must
 * be listed before it in app.config.ts: Expo runs a later plugin's project mod
 * first.
 */
export function loadXcodeEnvForSentryDebugFiles(project: XcodeProject): XcodeProject {
	let phase = project.pbxItemByComment(PHASE_NAME, 'PBXShellScriptBuildPhase') as
		| {shellScript: string}
		| undefined
	if (!phase) {
		throw new Error(
			`with-sentry-debug-files-environment: there is no "${PHASE_NAME}" build phase. Either @sentry/react-native/expo is no longer in app.config.ts, in which case drop this plugin too, or it is listed after this plugin, which must come first.`,
		)
	}

	let script = JSON.parse(phase.shellScript) as string
	if (script.includes('.xcode.env')) {
		return project
	}

	phase.shellScript = JSON.stringify(`${LOAD_XCODE_ENV}\n${script}`)
	return project
}

const withSentryDebugFilesEnvironment: ConfigPlugin = (config) =>
	withXcodeProject(config, (mod) => {
		mod.modResults = loadXcodeEnvForSentryDebugFiles(mod.modResults)
		return mod
	})

export default withSentryDebugFilesEnvironment
