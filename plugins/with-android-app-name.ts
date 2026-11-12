import {AndroidConfig, withStringsXml} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'

type ResourceXML = AndroidConfig.Resources.ResourceXML

/** The plugin's options. */
type Options = {
	/** The name the launcher and the app switcher show: the variant's `displayName`. */
	name: string
}

/**
 * A name as an Android string resource holds it. aapt2 reads a bare
 * apostrophe or double quote as markup and fails the build, and a leading
 * `@` or `?` as a reference to another resource, so those are escaped.
 */
export function androidStringValue(name: string): string {
	return name.replaceAll(/['"]/gu, (quote) => `\\${quote}`).replace(/^([@?])/u, '\\$1')
}

/** strings.xml with `app_name` set to `name`, in place of the one Expo wrote. */
export function setAppName(strings: ResourceXML, name: string): ResourceXML {
	return AndroidConfig.Strings.setStringItem(
		[
			AndroidConfig.Resources.buildResourceItem({
				name: 'app_name',
				value: androidStringValue(name),
			}),
		],
		strings,
	)
}

/**
 * Names the Android app after its variant. Expo writes `app_name` from
 * `name`, which stays the same across variants because it also names the
 * Xcode project and the Gradle root project; iOS takes the variant's name
 * from CFBundleDisplayName, and this is Android's counterpart. Expo applies
 * its own name mod after this plugin's is registered, so this one runs last.
 */
const withAndroidAppName: ConfigPlugin<Options> = (config, {name}) =>
	withStringsXml(config, (mod) => {
		mod.modResults = setAppName(mod.modResults, name)
		return mod
	})

export default withAndroidAppName
