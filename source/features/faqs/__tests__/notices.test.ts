import {noticesInForce} from '../notices'
import type {Faq} from '../types'

const faq = (overrides: Partial<Faq>): Faq => ({
	id: 'a',
	question: 'Q',
	answer: 'A',
	targets: [],
	bannerTitle: 'Q',
	bannerText: 'A',
	severity: 'notice',
	dismissable: true,
	...overrides,
})

describe('noticesInForce', () => {
	it('keeps an entry that targets a screen drawing banners', () => {
		let notice = faq({id: 'balances', targets: ['Balances']})
		expect(noticesInForce([notice])).toEqual([notice])
	})

	it('drops a plain FAQ that targets no screen', () => {
		expect(noticesInForce([faq({id: 'plain', targets: []})])).toEqual([])
	})

	it('drops an entry whose only target draws no banners', () => {
		let orphan = faq({id: 'orphan', targets: ['Faq' as never]})
		expect(noticesInForce([orphan])).toEqual([])
	})

	it('keeps the order it was given', () => {
		let home = faq({id: 'home', targets: ['Home']})
		let root = faq({id: 'root', targets: ['SettingsRoot']})
		expect(noticesInForce([root, home]).map((entry) => entry.id)).toEqual(['root', 'home'])
	})
})
