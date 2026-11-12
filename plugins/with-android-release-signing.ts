import {withAppBuildGradle} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'

/**
 * The environment variables that name Play's upload key, by the
 * signingConfig property each fills. The release workflow sets them from its
 * secrets; android/app/upload-keystore.properties, which is gitignored, can
 * hold the same properties for a release built on a maintainer's machine.
 */
export const UPLOAD_KEY_VARIABLES = {
	storeFile: 'ANDROID_UPLOAD_KEYSTORE_PATH',
	storePassword: 'ANDROID_UPLOAD_KEYSTORE_PASSWORD',
	keyAlias: 'ANDROID_UPLOAD_KEY_ALIAS',
	keyPassword: 'ANDROID_UPLOAD_KEY_PASSWORD',
} as const

/** Marks what this plugin wrote, so a second prebuild over the same file adds nothing. */
const MARKER = '// with-android-release-signing'

/**
 * Reads the upload key once, when Gradle evaluates the file. It is null when
 * nothing names one, so a release build keeps the debug key: the pull-request
 * build and the emulator screenshots need a release build without Play's key.
 * A key named only in part fails the build instead, as a signed-with-the-wrong-key
 * bundle would only be refused later, by Play.
 */
const UPLOAD_KEY = `${MARKER}: Play's upload key, from the environment or upload-keystore.properties.
def uploadKey = {
    def variables = [${Object.entries(UPLOAD_KEY_VARIABLES)
			.map(([property, variable]) => `${property}: '${variable}'`)
			.join(', ')}]
    def saved = new Properties()
    def savedFile = file('upload-keystore.properties')
    if (savedFile.exists()) {
        savedFile.withInputStream { saved.load(it) }
    }
    def key = variables.collectEntries { property, variable ->
        [(property): System.getenv(variable) ?: saved.getProperty(property)]
    }
    def missing = key.findAll { !it.value }.keySet()
    if (missing.size() == variables.size()) {
        return null
    }
    if (!missing.isEmpty()) {
        def names = missing.collect { "\${variables[it]} (\${it})" }.join(', ')
        throw new GradleException("The upload key is only partly set: \${names} missing.")
    }
    return key
}()

`

/** The release signingConfig, declared only when there is a key to give it. */
const RELEASE_SIGNING_CONFIG = `signingConfigs {
        ${MARKER}
        if (uploadKey != null) {
            release {
                storeFile file(uploadKey.storeFile)
                storePassword uploadKey.storePassword
                keyAlias uploadKey.keyAlias
                keyPassword uploadKey.keyPassword
            }
        }`

/** The template's warning to replace the debug key, which this plugin answers. */
const DEBUG_KEY_WARNING =
	/[ \t]*\/\/ Caution! In production[^\n]*\n[ \t]*\/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\n/u

/** The release buildType's own signingConfig line, which the template points at the debug key. */
const RELEASE_BUILD_TYPE =
	/(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/u

/**
 * android/app/build.gradle with a release signingConfig that reads Play's
 * upload key, used by the release buildType whenever the key is there.
 * Throws when the template no longer has the shape this edits, rather than
 * leaving every release build signed with the debug key.
 */
export function addReleaseSigning(buildGradle: string): string {
	if (buildGradle.includes(MARKER)) {
		return buildGradle
	}
	if (!/^android \{/mu.test(buildGradle)) {
		throw new Error('with-android-release-signing: no `android {` block in app/build.gradle.')
	}
	if (!/\bsigningConfigs \{/u.test(buildGradle)) {
		throw new Error('with-android-release-signing: no `signingConfigs {` in app/build.gradle.')
	}
	if (!RELEASE_BUILD_TYPE.test(buildGradle)) {
		throw new Error(
			'with-android-release-signing: the release buildType no longer signs with signingConfigs.debug.',
		)
	}
	return buildGradle
		.replace(/^android \{/mu, `${UPLOAD_KEY}android {`)
		.replace(/\bsigningConfigs \{/u, RELEASE_SIGNING_CONFIG)
		.replace(DEBUG_KEY_WARNING, '')
		.replace(
			RELEASE_BUILD_TYPE,
			'$1signingConfig uploadKey != null ? signingConfigs.release : signingConfigs.debug',
		)
}

/**
 * Signs release builds with Play's upload key when the build environment
 * names one, and with the debug key otherwise. No key or password reaches the
 * generated project: build.gradle reads them when Gradle runs.
 */
const withAndroidReleaseSigning: ConfigPlugin = (config) =>
	withAppBuildGradle(config, (mod) => {
		if (mod.modResults.language !== 'groovy') {
			throw new Error('with-android-release-signing: android/app/build.gradle is not Groovy.')
		}
		mod.modResults.contents = addReleaseSigning(mod.modResults.contents)
		return mod
	})

export default withAndroidReleaseSigning
