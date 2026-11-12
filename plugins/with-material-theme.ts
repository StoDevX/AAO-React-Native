import {
	AndroidConfig,
	withAndroidColors,
	withAndroidColorsNight,
	withAndroidStyles,
	withAppBuildGradle,
	withMainActivity,
	withMainApplication,
} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'

type ResourceXML = AndroidConfig.Resources.ResourceXML

/** A colour's value in each appearance, as CSS hex: `#RRGGBB` or `#RRGGBBAA`. */
type Pair = {light: string; dark: string}

/** The plugin's options. */
type Options = {
	/**
	 * Fixed colours with a light and a dark value, written as colour resources
	 * of the same names, with a night variant. `@frogpond/colors` reads them
	 * through `PlatformColor('@color/<name>')`; app.config.ts passes its
	 * `ADAPTIVE_COLORS`.
	 */
	colors?: Readonly<Record<string, Pair>>
}

/**
 * Material 3's DayNight theme without an action bar, which React Native's
 * native stack draws its own headers in place of. It descends from AppCompat,
 * which ReactActivity needs.
 */
export const MATERIAL_PARENT = 'Theme.Material3.DayNight.NoActionBar'

/** The theme prebuild gives the app, and the one this plugin reparents. */
const APP_THEME = 'AppTheme'

/**
 * Material Components, for the theme and `DynamicColors`. React Native does not
 * bring it in, and @expo/ui depends on it only as `implementation`, which keeps
 * it off the app's own compile classpath. The version is @expo/ui's, so Gradle
 * resolves one copy.
 */
const MATERIAL_DEPENDENCY = 'com.google.android.material:material'
const MATERIAL_VERSION = '1.13.0'

/**
 * Every Material 3 colour role the theme sets, by its theme attribute, as a
 * palette seeded from the brand gold (`gold` in @frogpond/colors,
 * `rgb(139, 117, 18)`): [light, dark].
 *
 * These are `SchemeTonalSpot` at standard contrast on the 2021 spec, from
 * material-color-utilities: the algorithm @expo/ui's `seedColorScheme` runs on
 * a Compose `Host` given that same seed, so a React Native view and a Compose
 * one agree. They are what a device below Android 12 shows; on 12 and later
 * `DynamicColors` overlays the wallpaper's own over every one. Recompute them
 * if the seed changes.
 */
export const SEEDED_ROLES: Readonly<Record<string, readonly [light: string, dark: string]>> = {
	colorPrimary: ['#6F5D0E', '#DDC56E'],
	colorOnPrimary: ['#FFFFFF', '#3A3000'],
	colorPrimaryContainer: ['#FBE187', '#544600'],
	colorOnPrimaryContainer: ['#544600', '#FBE187'],
	colorPrimaryInverse: ['#DDC56E', '#6F5D0E'],
	colorSecondary: ['#675E40', '#D2C6A1'],
	colorOnSecondary: ['#FFFFFF', '#373016'],
	colorSecondaryContainer: ['#EFE2BC', '#4E462A'],
	colorOnSecondaryContainer: ['#4E462A', '#EFE2BC'],
	colorTertiary: ['#44664D', '#AAD0B1'],
	colorOnTertiary: ['#FFFFFF', '#163722'],
	colorTertiaryContainer: ['#C6ECCD', '#2D4E37'],
	colorOnTertiaryContainer: ['#2D4E37', '#C6ECCD'],
	'android:colorBackground': ['#FFF8EF', '#16130B'],
	colorOnBackground: ['#1E1B13', '#E9E2D4'],
	colorSurface: ['#FFF8EF', '#16130B'],
	colorOnSurface: ['#1E1B13', '#E9E2D4'],
	colorSurfaceVariant: ['#EAE2CF', '#4B4639'],
	colorOnSurfaceVariant: ['#4B4639', '#CEC6B4'],
	colorSurfaceInverse: ['#333027', '#E9E2D4'],
	colorOnSurfaceInverse: ['#F7F0E2', '#333027'],
	colorError: ['#BA1A1A', '#FFB4AB'],
	colorOnError: ['#FFFFFF', '#690005'],
	colorErrorContainer: ['#FFDAD6', '#93000A'],
	colorOnErrorContainer: ['#93000A', '#FFDAD6'],
	colorOutline: ['#7C7767', '#979080'],
	colorOutlineVariant: ['#CEC6B4', '#4B4639'],
	colorSurfaceBright: ['#FFF8EF', '#3C392F'],
	colorSurfaceDim: ['#E0D9CC', '#16130B'],
	colorSurfaceContainerLowest: ['#FFFFFF', '#100E07'],
	colorSurfaceContainerLow: ['#FAF3E5', '#1E1B13'],
	colorSurfaceContainer: ['#F4EDDF', '#221F17'],
	colorSurfaceContainerHigh: ['#EFE7DA', '#2D2A21'],
	colorSurfaceContainerHighest: ['#E9E2D4', '#38352B'],
}

/**
 * The colour resource a seeded role's value is kept in: `colorOnSurface`
 * becomes `seedOnSurface`, and `android:colorBackground` `seedBackground`.
 */
export function seedResourceName(attribute: string): string {
	return `seed${attribute.replace(/^android:/u, '').replace(/^color/u, '')}`
}

/**
 * A CSS hex colour as Android's resource syntax. The two agree on `#RRGGBB`,
 * but CSS puts an alpha last (`#RRGGBBAA`) where Android puts it first
 * (`#AARRGGBB`), and reading one as the other gives a different colour.
 */
export function androidHex(css: string): string {
	if (/^#[\dA-Fa-f]{6}$/u.test(css)) {
		return css.toUpperCase()
	}
	if (/^#[\dA-Fa-f]{8}$/u.test(css)) {
		return `#${css.slice(7)}${css.slice(1, 7)}`.toUpperCase()
	}
	throw new Error(`with-material-theme: "${css}" is not a #RRGGBB or #RRGGBBAA colour.`)
}

/**
 * The colour resources for one appearance: every seeded role, under its
 * `seedResourceName`, and every colour in `colors` under its own name.
 */
export function colorResources(
	appearance: keyof Pair,
	colors: Readonly<Record<string, Pair>> = {},
): Record<string, string> {
	let index = appearance === 'light' ? 0 : 1
	let resources: Record<string, string> = {}
	for (let [attribute, pair] of Object.entries(SEEDED_ROLES)) {
		resources[seedResourceName(attribute)] = pair[index]
	}
	for (let [name, pair] of Object.entries(colors)) {
		if (name in resources) {
			throw new Error(`with-material-theme: the colour "${name}" clashes with a seeded role.`)
		}
		resources[name] = androidHex(pair[appearance])
	}
	return resources
}

/** Writes `resources` into a colors.xml, replacing any colour of the same name. */
export function setColors(
	xml: ResourceXML,
	resources: Readonly<Record<string, string>>,
): ResourceXML {
	for (let [name, value] of Object.entries(resources)) {
		xml = AndroidConfig.Colors.assignColorValue(xml, {name, value})
	}
	return xml
}

/**
 * Makes the app's theme Material 3: reparents it onto `MATERIAL_PARENT`, and
 * gives it every seeded role, each from its colour resource, which has a night
 * variant. That also replaces the `colorPrimary` prebuild sets from Expo's
 * default primary colour, which is not the brand's.
 */
export function applyMaterialTheme(xml: ResourceXML): ResourceXML {
	let theme = xml.resources.style?.find((style) => style.$.name === APP_THEME)
	if (!theme) {
		throw new Error(
			`with-material-theme: there is no ${APP_THEME} style in styles.xml. The Expo template moved it; update this plugin.`,
		)
	}
	theme.$.parent = MATERIAL_PARENT
	for (let attribute of Object.keys(SEEDED_ROLES)) {
		xml = AndroidConfig.Styles.assignStylesValue(xml, {
			add: true,
			name: attribute,
			value: `@color/${seedResourceName(attribute)}`,
			parent: AndroidConfig.Styles.getAppThemeGroup(),
		})
	}
	return xml
}

/** The Gradle line that adds Material Components to the app. */
const DEPENDENCY_LINE = `implementation("${MATERIAL_DEPENDENCY}:${MATERIAL_VERSION}")`

/** React Native's own dependency in the app's build.gradle, which Material's goes after. */
const REACT_DEPENDENCY = /^([ \t]*)implementation\("com\.facebook\.react:react-android"\)\n/mu

/**
 * Adds Material Components to android/app/build.gradle. Idempotent: prebuild
 * runs this on an already-patched file whenever the native project is
 * regenerated in place.
 */
export function addMaterialDependency(gradle: string): string {
	if (gradle.includes(MATERIAL_DEPENDENCY)) {
		return gradle
	}
	let anchor = REACT_DEPENDENCY.exec(gradle)
	if (!anchor) {
		throw new Error(
			'with-material-theme: could not find `implementation("com.facebook.react:react-android")` in android/app/build.gradle. The Expo template moved it; update this plugin.',
		)
	}
	let indent = anchor[1]
	let addition = `${indent}// Material 3: the app theme's parent, and DynamicColors in MainApplication.\n${indent}${DEPENDENCY_LINE}\n`
	return gradle.replace(anchor[0], `${anchor[0]}${addition}`)
}

const DYNAMIC_COLORS_IMPORT = 'import com.google.android.material.color.DynamicColors'

/** The first import in MainApplication.kt, which the new one goes before. */
const FIRST_IMPORT = /^import /mu

/** The Application's own `onCreate` calling its super, which the call goes after. */
const SUPER_ON_CREATE = /^([ \t]*)super\.onCreate\(\)\n/mu

/**
 * What MainApplication's `onCreate` runs first, after its super. The first
 * line applies dynamic colour to every activity: on Android 12 and later each
 * activity's theme takes its colour roles from the wallpaper, and below that
 * the call does nothing and the theme's seeded roles stand.
 *
 * The rest gives the application context the activity's theme and colours.
 * Expo modules convert a view's `PlatformColor` against the application
 * context, not the activity, and `DynamicColors` never reaches that context's
 * theme. Setting AppTheme on it explicitly makes sure Material's attributes
 * resolve there at all (a `?attr/colorOnSurface` tint that does not resolve
 * fails the prop's conversion), and the overlay makes them the wallpaper's.
 */
export const ON_CREATE_LINES = [
	'DynamicColors.applyToActivitiesIfAvailable(this)',
	'setTheme(R.style.AppTheme)',
	'if (DynamicColors.isDynamicColorAvailable()) {',
	'  theme.applyStyle(com.google.android.material.R.style.ThemeOverlay_Material3_DynamicColors_DayNight, true)',
	'}',
]

/**
 * Applies Material You's dynamic colour from MainApplication's `onCreate`:
 * see `ON_CREATE_LINES`. Idempotent, like `addMaterialDependency`.
 */
export function applyDynamicColors(kotlin: string): string {
	if (kotlin.includes(ON_CREATE_LINES[0])) {
		return kotlin
	}
	let onCreate = SUPER_ON_CREATE.exec(kotlin)
	if (!FIRST_IMPORT.test(kotlin) || !onCreate) {
		throw new Error(
			'with-material-theme: could not find an import and `super.onCreate()` in MainApplication.kt. The Expo template moved them; update this plugin.',
		)
	}
	let withImport = kotlin.includes(DYNAMIC_COLORS_IMPORT)
		? kotlin
		: kotlin.replace(FIRST_IMPORT, `${DYNAMIC_COLORS_IMPORT}\nimport `)
	let indent = onCreate[1]
	let lines = ON_CREATE_LINES.map((line) => `${indent}${line}\n`).join('')
	return withImport.replace(SUPER_ON_CREATE, (match) => `${match}${lines}`)
}

/** MainActivity's `setTheme(R.style.AppTheme)`, which the call goes after. */
const SET_APP_THEME = /^([ \t]*)setTheme\(R\.style\.AppTheme\);?\n/mu

/** What MainActivity runs right after setting its theme. */
export const REAPPLY_LINE = 'DynamicColors.applyToActivityIfAvailable(this)'

/**
 * Applies dynamic colour to MainActivity again, after it sets AppTheme.
 *
 * The activity starts on expo-splash-screen's theme, which `DynamicColors`
 * overlays with the wallpaper's colours before `onCreate` runs. `onCreate`
 * then calls `setTheme(R.style.AppTheme)`, which replaces that theme, overlay
 * and all, so every native view -- the app bars, and each `PlatformColor` a
 * React Native view converts against the activity -- fell back to the gold
 * seeded roles while Compose, which reads the wallpaper directly, did not.
 * Idempotent, like `applyDynamicColors`.
 */
export function reapplyDynamicColorsAfterSetTheme(kotlin: string): string {
	if (kotlin.includes(REAPPLY_LINE)) {
		return kotlin
	}
	let setTheme = SET_APP_THEME.exec(kotlin)
	if (!FIRST_IMPORT.test(kotlin) || !setTheme) {
		throw new Error(
			'with-material-theme: could not find an import and `setTheme(R.style.AppTheme)` in MainActivity.kt. The Expo template moved them; update this plugin.',
		)
	}
	let withImport = kotlin.includes(DYNAMIC_COLORS_IMPORT)
		? kotlin
		: kotlin.replace(FIRST_IMPORT, `${DYNAMIC_COLORS_IMPORT}\nimport `)
	return withImport.replace(SET_APP_THEME, (match) => `${match}${setTheme[1]}${REAPPLY_LINE}\n`)
}

/**
 * Gives the Android app a Material 3 DayNight theme with dynamic colour
 * (Material You), seeded from the brand gold where dynamic colour is not
 * available, and writes `colors` as day/night colour resources.
 */
const withMaterialTheme: ConfigPlugin<Options | undefined> = (config, options) => {
	let colors = options?.colors ?? {}
	config = withAndroidStyles(config, (mod) => {
		mod.modResults = applyMaterialTheme(mod.modResults)
		return mod
	})
	config = withAndroidColors(config, (mod) => {
		mod.modResults = setColors(mod.modResults, colorResources('light', colors))
		return mod
	})
	config = withAndroidColorsNight(config, (mod) => {
		mod.modResults = setColors(mod.modResults, colorResources('dark', colors))
		return mod
	})
	config = withAppBuildGradle(config, (mod) => {
		if (mod.modResults.language !== 'groovy') {
			throw new Error('with-material-theme: android/app/build.gradle is not Groovy.')
		}
		mod.modResults.contents = addMaterialDependency(mod.modResults.contents)
		return mod
	})
	config = withMainApplication(config, (mod) => {
		if (mod.modResults.language !== 'kt') {
			throw new Error('with-material-theme: MainApplication is not Kotlin.')
		}
		mod.modResults.contents = applyDynamicColors(mod.modResults.contents)
		return mod
	})
	return withMainActivity(config, (mod) => {
		if (mod.modResults.language !== 'kt') {
			throw new Error('with-material-theme: MainActivity is not Kotlin.')
		}
		mod.modResults.contents = reapplyDynamicColorsAfterSetTheme(mod.modResults.contents)
		return mod
	})
}

export default withMaterialTheme
