import {withAppDelegate, withXcodeProject} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'
import type {PbxprojSection, XcodeProject} from 'xcode'

type Reference = {value: string; comment?: string}

const APP_TARGET = 'AllAboutAnything'

const PACKAGE_URL = 'https://github.com/twostraws/KickstartSDK.git'
const PACKAGE_COMMENT = 'XCRemoteSwiftPackageReference "KickstartSDK"'
const PRODUCT_NAME = 'KickstartSignal'

/** The release the package is pinned to, so a build never moves with its main branch. */
const PACKAGE_VERSION = '0.6.0'

/** A pbxproj section, created empty when the project has none yet. */
function sectionNamed(project: XcodeProject, name: string): PbxprojSection {
	let objects = project.hash.project.objects
	objects[name] ??= {}
	return objects[name]
}

/**
 * Add KickstartSDK as a Swift package the app target depends on, linking its
 * `KickstartSignal` product in every configuration. Adding it twice changes
 * nothing, as prebuild runs this on an already-patched project whenever the
 * native project is regenerated in place.
 *
 * Duplicated in shape from `with-debug-swift.ts` rather than shared: Expo
 * compiles each plugin file on its own, so a relative import of a sibling .ts
 * does not resolve at prebuild time.
 */
export function addKickstartSdkPackage(project: XcodeProject, targetName: string): XcodeProject {
	let targetKey = project.findTargetKey(targetName)
	if (!targetKey) {
		throw new Error(`There is no \`${targetName}\` target in the Xcode project.`)
	}
	let target = project.pbxNativeTargetSection()[targetKey]
	if (typeof target === 'string' || target === undefined) {
		throw new Error(`The ${targetName} target is missing from the Xcode project.`)
	}

	let packages = sectionNamed(project, 'XCRemoteSwiftPackageReference')
	let alreadyAdded = Object.values(packages).some(
		(entry) => typeof entry !== 'string' && entry.repositoryURL === `"${PACKAGE_URL}"`,
	)
	if (alreadyAdded) return project

	let products = sectionNamed(project, 'XCSwiftPackageProductDependency')

	let packageKey = project.generateUuid()
	packages[packageKey] = {
		isa: 'XCRemoteSwiftPackageReference',
		repositoryURL: `"${PACKAGE_URL}"`,
		requirement: {kind: 'exactVersion', version: PACKAGE_VERSION},
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

	return project
}

// Indentation-tolerant: only the anchor adapts.
const LAUNCH_ANCHOR = /^[ \t]*let delegate = ReactNativeDelegate\(\)/mu
const IMPORT_ANCHOR = 'internal import Expo'

// Internal, as Expo's generated module provider imports FeatureRequests, since
// Swift rejects one module imported at two access levels.
const IMPORT = 'import KickstartSignal\nimport SwiftUI\ninternal import FeatureRequests\n'

// The Feature Requests screen is drawn by the FeatureRequests module, a pod
// that cannot import a Swift package linked into the app target alone. This
// hands it the board. The board brings its own title, toolbar and detail
// screens, so it needs a NavigationStack of its own; the route hides the
// router's header, which leaves Back to this button.
const START = `    FeatureRequests.makeBoard = { onBack in
      AnyView(
        NavigationStack {
          SignalBoardView(apiKey: "ks_live_sOB_c_zZAfsH8dG6CvSS51TYwEpcx-6vmd_SmUrltos")
            .toolbar {
              ToolbarItem(placement: .topBarLeading) {
                Button(action: onBack) {
                  Label("Back", systemImage: "chevron.backward")
                }
                .labelStyle(.iconOnly)
              }
            }
        }
      )
    }
`

/**
 * Hand the Signal board to the FeatureRequests module at launch.
 * Idempotent: prebuild runs this on an already-patched file whenever the native
 * project is regenerated in place.
 */
export function startKickstartSignal(contents: string): string {
	if (contents.includes('import KickstartSignal')) {
		return contents
	}

	let launch = LAUNCH_ANCHOR.exec(contents)
	if (!contents.includes(IMPORT_ANCHOR) || !launch) {
		throw new Error(
			'with-kickstart-sdk: could not find `internal import Expo` and `let delegate = ReactNativeDelegate()` in AppDelegate.swift. The Expo template moved them; update this plugin.',
		)
	}

	return contents
		.replace(IMPORT_ANCHOR, `${IMPORT}${IMPORT_ANCHOR}`)
		.replace(launch[0], `${START}${launch[0]}`)
}

const withKickstartSdk: ConfigPlugin = (config) => {
	config = withXcodeProject(config, (mod) => {
		mod.modResults = addKickstartSdkPackage(mod.modResults, APP_TARGET)
		return mod
	})
	return withAppDelegate(config, (mod) => {
		mod.modResults.contents = startKickstartSignal(mod.modResults.contents)
		return mod
	})
}

export default withKickstartSdk
