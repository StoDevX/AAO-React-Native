import {copyFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'

import {
	ConfigPlugin,
	IOSConfig,
	InfoPlist,
	withInfoPlist,
	withXcodeProject,
} from '@expo/config-plugins'

/** The key `react-native-change-icon` asks UIKit for. */
const ICON_NAME = 'icon_type_windmill'

/**
 * Loose PNGs rather than an asset catalog, because UIKit only resolves
 * alternate icons by filename. The `~iPad` variants are the idiom for
 * device-specific artwork.
 */
export const ALTERNATE_ICON_FILES = [
	'windmill@2x.png',
	'windmill@3x.png',
	'windmill@2x~iPad.png',
	'windmill@3x~iPad.png',
]

/** Where the tracked copies live, relative to the repository root. */
const SOURCE_DIR = join('images', 'icons')

interface AlternateIconSet {
	CFBundleAlternateIcons?: Record<
		string,
		{CFBundleIconFiles: string[]; UIPrerenderedIcon: boolean}
	>
}

export type InfoPlistWithAlternateIcons = InfoPlist & {
	CFBundleIcons: Required<AlternateIconSet>
	'CFBundleIcons~ipad': Required<AlternateIconSet>
}

function registerWindmill(existing: unknown): Required<AlternateIconSet> {
	let current = (existing ?? {}) as AlternateIconSet
	return {
		...current,
		CFBundleAlternateIcons: {
			...current.CFBundleAlternateIcons,
			[ICON_NAME]: {CFBundleIconFiles: ['windmill'], UIPrerenderedIcon: true},
		},
	}
}

/** Declare the alternate icon for both idioms, leaving every other key alone. */
export function addAlternateIcons(
	infoPlist: InfoPlist,
): InfoPlistWithAlternateIcons {
	return {
		...infoPlist,
		CFBundleIcons: registerWindmill(infoPlist.CFBundleIcons),
		'CFBundleIcons~ipad': registerWindmill(infoPlist['CFBundleIcons~ipad']),
	}
}

const withAlternateIcons: ConfigPlugin = (config) => {
	let withPlist = withInfoPlist(config, (mod) => {
		mod.modResults = addAlternateIcons(mod.modResults)
		return mod
	})

	return withXcodeProject(withPlist, (mod) => {
		let {projectRoot, platformProjectRoot} = mod.modRequest
		let groupName = mod.modRequest.projectName as string

		for (let filename of ALTERNATE_ICON_FILES) {
			let source = join(projectRoot, SOURCE_DIR, filename)
			if (!existsSync(source)) {
				throw new Error(
					`with-alternate-icons: ${SOURCE_DIR}/${filename} is missing. A missing alternate icon fails silently at runtime, so this is a hard error.`,
				)
			}

			copyFileSync(source, join(platformProjectRoot, groupName, filename))

			mod.modResults = IOSConfig.XcodeUtils.addResourceFileToGroup({
				filepath: join(groupName, filename),
				groupName,
				project: mod.modResults,
				isBuildFile: true,
			})
		}

		return mod
	})
}

export default withAlternateIcons
