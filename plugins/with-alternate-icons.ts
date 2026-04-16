import {withInfoPlist, withXcodeProject} from '@expo/config-plugins'

import type {ConfigPlugin} from './types'

export type XcodeProject = {
	pbxTargetByName: (name: string) => {uuid: string} | undefined
	pbxFileReferenceSection: () => Record<string, {name?: string}>
	addResourceFile: (
		path: string,
		opts: {target: string},
	) => {uuid: string} | null
}

export const ALTERNATE_ICON_KEY = 'icon_type_windmill'
export const ALTERNATE_ICON_FILE = 'windmill'
export const WINDMILL_RESOURCE_FILES = [
	'windmill@2x.png',
	'windmill@3x.png',
	'windmill@2x~iPad.png',
	'windmill@3x~iPad.png',
] as const

const WINDMILL_SOURCE_PREFIX = '../images/icons/'
const MAIN_TARGET_NAME = 'AllAboutOlaf'

type AlternateIconEntry = {
	CFBundleIconFiles: string[]
	UIPrerenderedIcon: boolean
}

type IconsDict = {
	CFBundleAlternateIcons?: Record<string, AlternateIconEntry>
	[key: string]: unknown
}

const ALTERNATE_ICON_ENTRY: AlternateIconEntry = {
	CFBundleIconFiles: [ALTERNATE_ICON_FILE],
	UIPrerenderedIcon: true,
}

function ensureAlternateIconsOnKey(
	plist: Record<string, unknown>,
	key: 'CFBundleIcons' | 'CFBundleIcons~ipad',
): void {
	const existing = (plist[key] as IconsDict | undefined) ?? {}
	const alternates = existing.CFBundleAlternateIcons ?? {}
	plist[key] = {
		...existing,
		CFBundleAlternateIcons: {
			...alternates,
			[ALTERNATE_ICON_KEY]: ALTERNATE_ICON_ENTRY,
		},
	}
}

export function addAlternateIcons(
	plist: Record<string, unknown>,
): Record<string, unknown> {
	const result = {...plist}
	ensureAlternateIconsOnKey(result, 'CFBundleIcons')
	ensureAlternateIconsOnKey(result, 'CFBundleIcons~ipad')
	return result
}

function isResourceFileRegistered(
	project: XcodeProject,
	filename: string,
): boolean {
	const fileRefs = project.pbxFileReferenceSection()
	for (const key of Object.keys(fileRefs)) {
		if (key.endsWith('_comment')) continue
		const name = fileRefs[key].name
		if (name === `"${filename}"` || name === filename) return true
	}
	return false
}

export function addWindmillResources(project: XcodeProject): XcodeProject {
	const target = project.pbxTargetByName(MAIN_TARGET_NAME)
	if (!target) {
		throw new Error(
			`with-alternate-icons: could not find target "${MAIN_TARGET_NAME}" in project.pbxproj. ` +
				`Run \`expo prebuild\` first, or verify the target name matches expo.name in app.config.ts.`,
		)
	}
	for (const filename of WINDMILL_RESOURCE_FILES) {
		if (isResourceFileRegistered(project, filename)) continue
		project.addResourceFile(`${WINDMILL_SOURCE_PREFIX}${filename}`, {
			target: target.uuid,
		})
	}
	return project
}

const withAlternateIcons: ConfigPlugin = (config) => {
	config = withInfoPlist(config, (cfg) => {
		cfg.modResults = addAlternateIcons(
			cfg.modResults as Record<string, unknown>,
		) as typeof cfg.modResults
		return cfg
	})
	config = withXcodeProject(config, (cfg) => {
		cfg.modResults = addWindmillResources(
			cfg.modResults as unknown as XcodeProject,
		) as unknown as typeof cfg.modResults
		return cfg
	})
	return config
}

export default withAlternateIcons
