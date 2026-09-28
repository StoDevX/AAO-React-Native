import {describe, expect, test} from '@jest/globals'

import {AllViews, opensInBrowser, type ViewType} from '../views'

function viewTitled(title: string): ViewType {
	let view = AllViews().find((v) => v.title === title)
	if (!view) {
		throw new Error(`no view titled ${title}`)
	}
	return view
}

describe('opensInBrowser', () => {
	test('is true for a web link', () => {
		expect(opensInBrowser(viewTitled('SIS'))).toBe(true)
	})

	test('is false for a native screen', () => {
		expect(opensInBrowser(viewTitled('Menus'))).toBe(false)
	})
})

describe('SIS', () => {
	test('opens the SIS landing page on the web', () => {
		expect(viewTitled('SIS')).toMatchObject({
			type: 'url',
			url: 'https://sis.stolaf.edu/sis/landing-page.cfm',
		})
	})
})
