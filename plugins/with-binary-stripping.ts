import {ConfigPlugin, withXcodeProject} from '@expo/config-plugins'
import type {XcodeProject} from 'xcode'

/**
 * Read one record out of a pbxproj section. Sections interleave records with
 * `<uuid>_comment` strings, so every lookup is `T | string` until narrowed.
 *
 * Duplicated rather than shared: Expo compiles each plugin file on its own, so
 * a relative import of a sibling .ts does not resolve at prebuild time. Jest
 * resolves it happily, which is why only a real prebuild catches it.
 */
function entryIn<T>(
	section: Record<string, T | string>,
	key: string,
	what: string,
): T {
	let entry = section[key]
	if (typeof entry === 'string' || entry === undefined) {
		throw new Error(`${what} is missing from the Xcode project.`)
	}
	return entry
}

/** Every build settings dictionary belonging to a target, Debug and Release. */
function buildSettingsFor(
	project: XcodeProject,
	targetName: string,
): Record<string, string>[] {
	let targetKey = project.findTargetKey(targetName)
	if (!targetKey) {
		throw new Error(
			`There is no \`${targetName}\` target in the Xcode project.`,
		)
	}

	let target = entryIn(
		project.pbxNativeTargetSection(),
		targetKey,
		`the ${targetName} target`,
	)
	let list = entryIn(
		project.pbxXCConfigurationList(),
		target.buildConfigurationList,
		`the build configuration list for ${targetName}`,
	)
	let section = project.pbxXCBuildConfigurationSection()

	return list.buildConfigurations.map(
		(entry) =>
			entryIn(section, entry.value, `build configuration ${entry.comment}`)
				.buildSettings as Record<string, string>,
	)
}

const APP_TARGET = 'AllAboutOlaf'

/**
 * Strip symbols from the linked binary. prebuild sets neither, and their
 * absence shows up only as a larger download, never as a failure.
 *
 * `-rSTx` is strip's: keep relocation info, strip Swift symbols, strip
 * debugging entries, strip local symbols.
 */
export const STRIPPING_SETTINGS = {
	DEPLOYMENT_POSTPROCESSING: 'YES',
	STRIPFLAGS: '"-rSTx"',
}

export function applyStripping(
	project: XcodeProject,
	targetName: string,
): XcodeProject {
	for (let settings of buildSettingsFor(project, targetName)) {
		Object.assign(settings, STRIPPING_SETTINGS)
	}
	return project
}

const withBinaryStripping: ConfigPlugin = (config) =>
	withXcodeProject(config, (mod) => {
		mod.modResults = applyStripping(mod.modResults, APP_TARGET)
		return mod
	})

export default withBinaryStripping
