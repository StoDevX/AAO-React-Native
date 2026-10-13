import {cpSync, existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

import {IOSConfig, withXcodeProject} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'
import type {XcodeProject} from 'xcode'

/**
 * Every Icon Composer document in assets/. A variant bundles all but its
 * primary as alternates; each document's name is the key
 * `react-native-change-icon` passes to `setAlternateIconName`.
 */
export const ICON_DOCUMENTS = [
	'windmill',
	'old-main',
	'windmill-sky',
	'windmill-dawn',
	'windmill-golden-hour',
]

/**
 * App icon sets bundled as they are, with no `.icon` document, for an icon
 * whose tinted look adds nothing: each set costs one render per appearance it
 * lists. Each lives at assets/<name>.xcassets/<name>.appiconset.
 */
export const STATIC_ICON_SETS = ['old-main-retro', 'carls-penguin']

/** The documents and sets bundled as alternates beside `primary`: every one but it. */
export function alternatesFor(primary: string): {documents: string[]; sets: string[]} {
	return {
		documents: ICON_DOCUMENTS.filter((name) => name !== primary),
		sets: STATIC_ICON_SETS.filter((name) => name !== primary),
	}
}

/** Where the tracked documents live, relative to the repository root. */
const SOURCE_DIR = 'assets'

const APP_TARGET = 'AllAboutAnything'

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

/**
 * Store the asset catalog zipped rather than in lzfse. actool keeps a flat
 * 1024px render of every icon in each appearance, without loss, and zip makes
 * those about a tenth smaller.
 */
export function compressAppIcons(project: XcodeProject, targetName: string): XcodeProject {
	for (let settings of buildSettingsFor(project, targetName)) {
		settings.ASSETCATALOG_COMPILER_OPTIMIZATION = 'space'
	}
	return project
}

/** Add each alternate's document to the app group and its Resources phase. */
export function addAlternateIconResources(
	project: XcodeProject,
	groupName: string,
	primary: string,
): XcodeProject {
	for (let name of alternatesFor(primary).documents) {
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

/** Copy each alternate's document, and each static alternate set, from the repository into the native project. */
export function copyAlternateIcons(
	projectRoot: string,
	destination: string,
	primary: string,
): void {
	let {documents, sets} = alternatesFor(primary)
	for (let name of documents) {
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

	for (let name of sets) {
		let set = join(SOURCE_DIR, `${name}.xcassets`, `${name}.appiconset`)
		let source = join(projectRoot, set)
		if (!existsSync(source)) {
			throw new Error(
				`with-alternate-icons: ${set} is missing. A missing alternate icon fails silently at runtime, so this is a hard error.`,
			)
		}
		cpSync(source, join(destination, 'Images.xcassets', `${name}.appiconset`), {recursive: true})
	}
}

/** What app.config.ts passes. */
type Options = {
	/** The variant's primary icon, `ios.icon`'s name, which is left out of the alternates. */
	primary: string
}

/**
 * The primary icon's name, checked against `icon`, the variant's `ios.icon`. A
 * primary that `icon` does not name would leave the real app icon out of the
 * alternates and bundle the named one twice.
 */
export function primaryFrom(icon: string | undefined, options: Options | void): string {
	let primary = options?.primary
	if (!primary) {
		throw new Error(
			"with-alternate-icons: pass the variant's primary icon, as `['./plugins/with-alternate-icons', {primary}]`.",
		)
	}
	if (!icon?.endsWith(`/${primary}.icon`) && !icon?.includes(`/${primary}.appiconset/`)) {
		throw new Error(
			`with-alternate-icons: the primary icon is ${primary}, but ios.icon is ${icon ?? 'unset'}.`,
		)
	}
	return primary
}

const withAlternateIcons: ConfigPlugin<Options | void> = (config, options) =>
	withXcodeProject(config, (mod) => {
		let {projectRoot, platformProjectRoot} = mod.modRequest
		let groupName = mod.modRequest.projectName as string
		let icon = config.ios?.icon
		let primary = primaryFrom(typeof icon === 'string' ? icon : undefined, options)

		// The primary is Expo's to copy, but it breaks the build the same way.
		if (typeof icon === 'string' && icon.endsWith('.icon')) {
			assertLayersPresent(projectRoot, icon)
		}

		copyAlternateIcons(projectRoot, join(platformProjectRoot, groupName), primary)
		mod.modResults = addAlternateIconResources(mod.modResults, groupName, primary)
		mod.modResults = includeAllAppIcons(mod.modResults, APP_TARGET)
		mod.modResults = compressAppIcons(mod.modResults, APP_TARGET)
		return mod
	})

export default withAlternateIcons
