import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, test} from '@jest/globals'

import {AllViews, CUSTOM_SYMBOLS, iconImage, opensInBrowser, type ViewType} from '../views'

function onlyView(matches: (view: ViewType) => boolean): ViewType {
	let found = AllViews().filter(matches)
	if (found.length !== 1) {
		throw new Error(`expected one matching view, found ${found.length}`)
	}
	return found[0]
}

const balancesOnTheWeb = onlyView((v) => v.title === 'Balances' && v.type === 'url')
const balancesScreen = onlyView((v) => v.title === 'Balances' && v.type === 'view')

describe('opensInBrowser', () => {
	test('is true for a web link', () => {
		expect(opensInBrowser(balancesOnTheWeb)).toBe(true)
	})

	test('is false for a native screen', () => {
		expect(opensInBrowser(balancesScreen)).toBe(false)
	})
})

describe('Balances', () => {
	test('opens the SIS landing page on the web', () => {
		expect(balancesOnTheWeb).toMatchObject({
			url: 'https://sis.stolaf.edu/sis/index.cfm',
			icon: 'arrow.up.right',
		})
		expect(balancesOnTheWeb.disabled).toBeFalsy()
	})

	test('keeps the native screen listed, but turned off', () => {
		expect(balancesScreen).toMatchObject({view: '/balances', disabled: true})
	})
})

describe('iconImage', () => {
	test('names an SF Symbol by its system name', () => {
		expect(iconImage('fork.knife')).toEqual({systemName: 'fork.knife'})
	})

	test('names a custom symbol by its asset name', () => {
		expect(iconImage('olaf-messenger')).toEqual({assetName: 'olaf-messenger'})
	})
})

describe('custom symbols', () => {
	test.each(CUSTOM_SYMBOLS)('%s has a symbol set for the asset catalog', (name) => {
		let symbolSet = join(__dirname, '../../../assets/symbols', `${name}.symbolset`, `${name}.svg`)
		expect(existsSync(symbolSet)).toBe(true)
	})
})

describe('Olaf Messenger', () => {
	test("shows the paper's castle", () => {
		expect(onlyView((v) => v.title === 'Olaf Messenger').icon).toBe('olaf-messenger')
	})
})
