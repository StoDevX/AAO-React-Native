import {cpSync, existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

import {IOSConfig, withXcodeProject} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'
import type {XcodeProject} from 'xcode'

/**
 * The Icon Composer documents offered besides the primary, which `ios.icon`
 * names. Each document's name is the key `react-native-change-icon` passes to
 * `setAlternateIconName`.
 */
export const ALTERNATE_ICONS = [
	'sunset-behind-main',
	'windmill-day',
	'windmill-night',
	'windmill-dawn',
	'windmill-storm',
	'windmill-golden-hour',
	'windmill-aurora',
	'windmill-fog',
	'windmill-snow',
]

/** Where the tracked documents live, relative to the repository root. */
const SOURCE_DIR = 'assets'

const APP_TARGET = 'AllAboutOlaf'

/**
 * Read one record out of a pbxproj section. Sections interleave records with
 * `<uuid>_comment` strings, so every lookup is `T | string` until narrowed.
 *
 * Duplicated rather than shared: Expo compiles each plugin file on its own, so
 * a relative import of a sibling .ts does not resolve at prebuild time.
 */
function entryIn<T>(section: Record<string, T | string>, key: string, what: string): T {
	let entry = section[key]
	if (typeof entry === 'string' || entry === undefined) {
		throw new Error(`${what} is missing from the Xcode project.`)
	}
	return entry
}

/** Every build settings dictionary belonging to a target, Debug and Release. */
function buildSettingsFor(project: XcodeProject, targetName: string): Record<string, string>[] {
	let targetKey = project.findTargetKey(targetName)
	if (!targetKey) {
		throw new Error(`There is no \`${targetName}\` target in the Xcode project.`)
	}

	let target = entryIn(project.pbxNativeTargetSection(), targetKey, `the ${targetName} target`)
	let list = entryIn(
		project.pbxXCConfigurationList(),
		target.buildConfigurationList,
		`the build configuration list for ${targetName}`,
	)
	let section = project.pbxXCBuildConfigurationSection()

	return list.buildConfigurations.map(
		(entry) =>
			entryIn(section, entry.value, `build configuration ${entry.comment}`).buildSettings as Record<
				string,
				string
			>,
	)
}

/**
 * Compile every app icon in the target, not only the primary. Without it the
 * alternates never reach the bundle's Info.plist, and `setAlternateIconName`
 * fails at runtime.
 */
export function includeAllAppIcons(project: XcodeProject, targetName: string): XcodeProject {
	for (let settings of buildSettingsFor(project, targetName)) {
		settings.ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS = 'YES'
	}
	return project
}

/** Add each alternate's document to the app group and its Resources phase. */
export function addAlternateIconResources(project: XcodeProject, groupName: string): XcodeProject {
	for (let name of ALTERNATE_ICONS) {
		project = IOSConfig.XcodeUtils.addResourceFileToGroup({
			filepath: join(groupName, `${name}.icon`),
			groupName,
			project,
			isBuildFile: true,
		})
	}
	return project
}

/** Every value of an `image-name` key, at any depth of an icon.json. */
function imageNames(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap(imageNames)
	}
	if (typeof value !== 'object' || value === null) {
		return []
	}
	return Object.entries(value).flatMap(([key, child]) =>
		key === 'image-name' && typeof child === 'string' ? [child] : imageNames(child),
	)
}

/**
 * Check that every layer image an Icon Composer document names is on disk.
 * actool reports a missing one only as "Icon export exited with status 255".
 */
export function assertLayersPresent(projectRoot: string, documentPath: string): void {
	let manifest: unknown = JSON.parse(
		readFileSync(join(projectRoot, documentPath, 'icon.json'), 'utf8'),
	)
	for (let image of imageNames(manifest)) {
		let layer = join(documentPath, 'Assets', image)
		if (!existsSync(join(projectRoot, layer))) {
			throw new Error(
				`with-alternate-icons: ${layer} is missing, so Xcode cannot build the icon. Check that it is committed.`,
			)
		}
	}
}

/** Copy each alternate's document from the repository into the native project. */
export function copyAlternateIcons(projectRoot: string, destination: string): void {
	for (let name of ALTERNATE_ICONS) {
		let document = join(SOURCE_DIR, `${name}.icon`)
		let source = join(projectRoot, document)
		if (!existsSync(source)) {
			throw new Error(
				`with-alternate-icons: ${SOURCE_DIR}/${name}.icon is missing. A missing alternate icon fails silently at runtime, so this is a hard error.`,
			)
		}
		assertLayersPresent(projectRoot, document)
		cpSync(source, join(destination, `${name}.icon`), {recursive: true})
	}
}

const withAlternateIcons: ConfigPlugin = (config) =>
	withXcodeProject(config, (mod) => {
		let {projectRoot, platformProjectRoot} = mod.modRequest
		let groupName = mod.modRequest.projectName as string

		// The primary is Expo's to copy, but it breaks the build the same way.
		let primary = config.ios?.icon
		if (typeof primary === 'string' && primary.endsWith('.icon')) {
			assertLayersPresent(projectRoot, primary)
		}

		copyAlternateIcons(projectRoot, join(platformProjectRoot, groupName))
		mod.modResults = addAlternateIconResources(mod.modResults, groupName)
		mod.modResults = includeAllAppIcons(mod.modResults, APP_TARGET)
		return mod
	})

export default withAlternateIcons
