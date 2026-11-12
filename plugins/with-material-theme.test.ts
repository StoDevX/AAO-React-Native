import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {AndroidConfig, XML} from '@expo/config-plugins'

import {
	MATERIAL_PARENT,
	addMaterialDependency,
	androidHex,
	applyDynamicColors,
	applyMaterialTheme,
	colorResources,
} from './with-material-theme.ts'

type ResourceXML = AndroidConfig.Resources.ResourceXML

/** A fixture from plugins/fixtures, as prebuild writes it before this plugin runs. */
function fixture(name: string): string {
	return readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8')
}

const STOCK_MAIN_APPLICATION = fixture('MainApplication.kt')
const STOCK_BUILD_GRADLE = fixture('build.gradle')

async function stockStyles(): Promise<ResourceXML> {
	let xml = await XML.parseXMLAsync(fixture('styles.xml'))
	return xml as ResourceXML
}

/** The app theme's items, by name. */
function themeItems(xml: ResourceXML): Record<string, string> {
	return AndroidConfig.Styles.getStylesGroupAsObject(xml, {name: 'AppTheme'}) ?? {}
}

describe('androidHex', () => {
	// CSS and Android disagree on where an alpha goes, and a shadow's 30% black
	// read the wrong way round is an opaque blue.
	it('moves a CSS alpha to the front, where Android reads it', () => {
		assert.equal(androidHex('#0000004d'), '#4D000000')
	})

	it('leaves an opaque colour as it is', () => {
		assert.equal(androidHex('#1c1a17'), '#1C1A17')
	})

	it('refuses anything that is not six or eight hex digits', () => {
		assert.throws(() => androidHex('rgb(0, 0, 0)'), /not a #RRGGBB or #RRGGBBAA/u)
		assert.throws(() => androidHex('#FFF'), /not a #RRGGBB or #RRGGBBAA/u)
	})
})

describe('colorResources', () => {
	let colors = {newspaperPaper: {light: '#FBF9F4', dark: '#1C1A17'}}

	it('takes each colour in the appearance asked for', () => {
		assert.equal(colorResources('light', colors).newspaperPaper, '#FBF9F4')
		assert.equal(colorResources('dark', colors).newspaperPaper, '#1C1A17')
	})

	// A colour named like a seeded role would silently repaint the theme.
	it('refuses a colour that would replace a seeded role', () => {
		assert.throws(
			() => colorResources('light', {seedPrimary: {light: '#000000', dark: '#FFFFFF'}}),
			/clashes with a seeded role/u,
		)
	})
})

describe('applyMaterialTheme', () => {
	it('makes the app theme a Material 3 DayNight theme', async () => {
		let xml = applyMaterialTheme(await stockStyles())
		let theme = xml.resources.style?.find((style) => style.$.name === 'AppTheme')
		assert.equal(theme?.$.parent, MATERIAL_PARENT)
	})

	// Expo's own colorPrimary is a navy unrelated to the brand, and two items of
	// one name in a style is an error at build time.
	it("replaces Expo's colorPrimary rather than adding a second", async () => {
		let xml = applyMaterialTheme(await stockStyles())
		let theme = xml.resources.style?.find((style) => style.$.name === 'AppTheme')
		let primaries = theme?.item.filter((item) => item.$.name === 'colorPrimary') ?? []
		assert.equal(primaries.length, 1)
		assert.equal(primaries[0]?._, '@color/seedPrimary')
	})

	it('keeps the items prebuild set for React Native', async () => {
		let items = themeItems(applyMaterialTheme(await stockStyles()))
		assert.equal(items['android:editTextBackground'], '@drawable/rn_edit_text_material')
		assert.equal(items['android:statusBarColor'], '@android:color/transparent')
	})

	// aapt fails the build on a theme item naming a colour that does not exist,
	// and a day-only colour would leave dark mode with the light value.
	it('names only colours that exist in both appearances', async () => {
		let items = themeItems(applyMaterialTheme(await stockStyles()))
		let light = colorResources('light')
		let dark = colorResources('dark')
		let named = Object.values(items)
			.filter((value) => value.startsWith('@color/'))
			.map((value) => value.slice('@color/'.length))
		assert.ok(named.length > 0)
		for (let name of named) {
			assert.ok(name in light, `${name} has no light value`)
			assert.ok(name in dark, `${name} has no dark value`)
		}
	})

	it('leaves the splash theme inheriting from the app theme', async () => {
		let xml = applyMaterialTheme(await stockStyles())
		let splash = xml.resources.style?.find((style) => style.$.name === 'Theme.App.SplashScreen')
		assert.equal(splash?.$.parent, 'AppTheme')
	})

	it('says so when the template has no AppTheme', () => {
		let xml: ResourceXML = {resources: {style: []}}
		assert.throws(() => applyMaterialTheme(xml), /no AppTheme style/u)
	})
})

describe('addMaterialDependency', () => {
	it('adds Material Components beside React Native', () => {
		let patched = addMaterialDependency(STOCK_BUILD_GRADLE)
		assert.match(
			patched,
			/implementation\("com\.facebook\.react:react-android"\)\n.*\n\s*implementation\("com\.google\.android\.material:material:[\d.]+"\)\n/u,
		)
	})

	it('adds it once, however often prebuild runs', () => {
		let once = addMaterialDependency(STOCK_BUILD_GRADLE)
		assert.equal(addMaterialDependency(once), once)
	})

	it('says so when the template moved React Native', () => {
		assert.throws(() => addMaterialDependency('dependencies {\n}\n'), /update this plugin/u)
	})
})

describe('applyDynamicColors', () => {
	// Before any activity is created, so the first one already has the
	// wallpaper's colours; and after super, which sets the Application up.
	it('applies dynamic colour as the first thing after super.onCreate()', () => {
		let patched = applyDynamicColors(STOCK_MAIN_APPLICATION)
		assert.match(
			patched,
			/override fun onCreate\(\) \{\n {4}super\.onCreate\(\)\n {4}DynamicColors\.applyToActivitiesIfAvailable\(this\)\n/u,
		)
	})

	it('imports DynamicColors', () => {
		let patched = applyDynamicColors(STOCK_MAIN_APPLICATION)
		assert.match(patched, /^import com\.google\.android\.material\.color\.DynamicColors$/mu)
	})

	it('changes nothing the second time', () => {
		let once = applyDynamicColors(STOCK_MAIN_APPLICATION)
		assert.equal(applyDynamicColors(once), once)
	})

	it('says so when the template moved onCreate', () => {
		assert.throws(
			() => applyDynamicColors('import android.app.Application\n\nclass MainApplication\n'),
			/update this plugin/u,
		)
	})
})
