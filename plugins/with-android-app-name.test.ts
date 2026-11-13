import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {AndroidConfig, XML} from '@expo/config-plugins'

import {androidStringValue, setAppName} from './with-android-app-name.ts'

type ResourceXML = AndroidConfig.Resources.ResourceXML

/** strings.xml as Expo writes it, with the shared project name. */
async function stockStrings(): Promise<ResourceXML> {
	let xml = await XML.parseXMLAsync(
		'<resources><string name="app_name">All About Anything</string></resources>',
	)
	return xml as ResourceXML
}

describe('setAppName', () => {
	// Two strings of one name are an error at build time.
	it("replaces Expo's app_name rather than adding a second", async () => {
		let strings = setAppName(await stockStrings(), 'CARLS')
		let names = strings.resources.string?.filter((item) => item.$.name === 'app_name')
		assert.deepEqual(
			names?.map((item) => item._),
			['CARLS'],
		)
	})
})

describe('androidStringValue', () => {
	it('escapes the quotes aapt2 would read as markup', () => {
		assert.equal(androidStringValue(`St. Olaf's "Oles"`), `St. Olaf\\'s \\"Oles\\"`)
	})

	it('escapes a leading @, which would otherwise name another resource', () => {
		assert.equal(androidStringValue('@Olaf'), '\\@Olaf')
	})

	it('leaves a plain name alone', () => {
		assert.equal(androidStringValue('All About Olaf'), 'All About Olaf')
	})
})
