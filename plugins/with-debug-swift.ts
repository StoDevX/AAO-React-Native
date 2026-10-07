import {withAppDelegate, withXcodeProject} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'
import type {PbxprojSection, XcodeProject} from 'xcode'

type Reference = {value: string; comment?: string}

const APP_TARGET = 'AllAboutOlaf'

const PACKAGE_URL = 'https://github.com/DebugSwift/DebugSwift.git'
const PACKAGE_COMMENT = 'XCRemoteSwiftPackageReference "DebugSwift"'
const PRODUCT_NAME = 'DebugSwift'

/** The package's code, built as one object file for Xcode to link. */
const PACKAGE_OBJECT = 'DebugSwift.o'

const REMOVAL_PHASE = '[DebugSwift] Remove resources outside Debug'

/**
 * Xcode copies the package's resource bundle, its localized strings, into the
 * app before any build phase runs, and no build setting stops it.
 */
const REMOVAL_SCRIPT = [
	'if [ "$CONFIGURATION" != "Debug" ]; then',
	'  rm -rf "$TARGET_BUILD_DIR/$WRAPPER_NAME/DebugSwift_DebugSwift.bundle"',
	'fi',
].join('\n')

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

/** A pbxproj section, created empty when the project has none yet. */
function sectionNamed(project: XcodeProject, name: string): PbxprojSection {
	let objects = project.hash.project.objects
	objects[name] ??= {}
	return objects[name]
}

/**
 * Add DebugSwift as a Swift package the app target depends on, linked into
 * Debug builds only.
 *
 * Xcode links every package product a target depends on, in every
 * configuration, and offers no per-configuration switch for one. So outside
 * Debug the package's object file is named in `EXCLUDED_SOURCE_FILE_NAMES`,
 * which drops it from what the target links, and a script phase deletes the
 * resource bundle Xcode copied into the app. Xcode still builds the package
 * for a Release build; it just goes unused. The Swift that calls it sits
 * behind `#if DEBUG`, so nothing in a Release build refers to it.
 */
export function addDebugSwiftPackage(project: XcodeProject, targetName: string): XcodeProject {
	let targetKey = project.findTargetKey(targetName)
	if (!targetKey) {
		throw new Error(`There is no \`${targetName}\` target in the Xcode project.`)
	}
	let target = entryIn(project.pbxNativeTargetSection(), targetKey, `the ${targetName} target`)

	let packages = sectionNamed(project, 'XCRemoteSwiftPackageReference')
	let products = sectionNamed(project, 'XCSwiftPackageProductDependency')

	let alreadyAdded = Object.values(packages).some(
		(entry) => typeof entry !== 'string' && entry.repositoryURL === `"${PACKAGE_URL}"`,
	)
	if (!alreadyAdded) {
		let packageKey = project.generateUuid()
		packages[packageKey] = {
			isa: 'XCRemoteSwiftPackageReference',
			repositoryURL: `"${PACKAGE_URL}"`,
			requirement: {kind: 'upToNextMajorVersion', minimumVersion: '1.0.0'},
		}
		packages[`${packageKey}_comment`] = PACKAGE_COMMENT

		let productKey = project.generateUuid()
		products[productKey] = {
			isa: 'XCSwiftPackageProductDependency',
			package: packageKey,
			package_comment: PACKAGE_COMMENT,
			productName: PRODUCT_NAME,
		}
		products[`${productKey}_comment`] = PRODUCT_NAME

		let root = project.getFirstProject().firstProject
		root.packageReferences = [
			...((root.packageReferences as Reference[] | undefined) ?? []),
			{value: packageKey, comment: PACKAGE_COMMENT},
		]
		target.packageProductDependencies = [
			...((target.packageProductDependencies as Reference[] | undefined) ?? []),
			{value: productKey, comment: PRODUCT_NAME},
		]
	}

	let list = entryIn(
		project.pbxXCConfigurationList(),
		target.buildConfigurationList,
		`the build configuration list for ${targetName}`,
	)
	let configurations = project.pbxXCBuildConfigurationSection()
	for (let entry of list.buildConfigurations) {
		let configuration = entryIn(configurations, entry.value, `build configuration ${entry.comment}`)
		if (configuration.name !== 'Debug') {
			configuration.buildSettings.EXCLUDED_SOURCE_FILE_NAMES = PACKAGE_OBJECT
		}
	}

	if (!project.pbxItemByComment(REMOVAL_PHASE, 'PBXShellScriptBuildPhase')) {
		let {buildPhase} = project.addBuildPhase(
			[],
			'PBXShellScriptBuildPhase',
			REMOVAL_PHASE,
			targetKey,
			{
				shellPath: '/bin/sh',
				shellScript: '',
			},
		)
		// Set here rather than passed in: xcode quotes the script but leaves
		// its newlines raw, which is not how Xcode writes one.
		buildPhase.shellScript = JSON.stringify(REMOVAL_SCRIPT)
		// It has no outputs to check, so it runs on every build by design.
		buildPhase.alwaysOutOfDate = 1
	}

	return project
}

// Indentation-tolerant: only the anchor adapts.
const LAUNCH_ANCHOR = /^[ \t]*let delegate = ReactNativeDelegate\(\)/mu
const IMPORT_ANCHOR = 'internal import Expo'

const IMPORT = '#if DEBUG\nimport DebugSwift\n#endif\n'

// UI tests and chaos runs launch Debug builds too, and the floating button
// would sit over what they tap and screenshot.
const START = `    #if DEBUG
    let launchArguments = ProcessInfo.processInfo.arguments
    if !launchArguments.contains("--uitesting") && !launchArguments.contains("--chaos") {
      DebugSwift().setup().show()
    }
    #endif
`

/**
 * Start DebugSwift at launch in Debug builds, as its README sets it up.
 * Idempotent: prebuild runs this on an already-patched file whenever the native
 * project is regenerated in place.
 */
export function startDebugSwift(contents: string): string {
	if (contents.includes('import DebugSwift')) {
		return contents
	}

	let launch = LAUNCH_ANCHOR.exec(contents)
	if (!contents.includes(IMPORT_ANCHOR) || !launch) {
		throw new Error(
			'with-debug-swift: could not find `internal import Expo` and `let delegate = ReactNativeDelegate()` in AppDelegate.swift. The Expo template moved them; update this plugin.',
		)
	}

	return contents
		.replace(IMPORT_ANCHOR, `${IMPORT}${IMPORT_ANCHOR}`)
		.replace(launch[0], `${START}${launch[0]}`)
}

const withDebugSwift: ConfigPlugin = (config) => {
	config = withXcodeProject(config, (mod) => {
		mod.modResults = addDebugSwiftPackage(mod.modResults, APP_TARGET)
		return mod
	})
	return withAppDelegate(config, (mod) => {
		mod.modResults.contents = startDebugSwift(mod.modResults.contents)
		return mod
	})
}

export default withDebugSwift
