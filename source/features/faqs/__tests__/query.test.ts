import {describe, expect, test} from '@jest/globals'

import {faqsFor} from '../query'

/** A notice as `data/faqs.yaml` writes one, shown where `conditions` allow. */
const notice = (id: string, conditions?: unknown) => ({
	id,
	question: `Question ${id}`,
	answer: `Answer ${id}`,
	bannerTitle: `Banner ${id}`,
	bannerText: `Banner text ${id}`,
	conditions,
})

/** Both apps' notices, in one list. */
const LIST = {
	text: 'All About Olaf’s own text',
	faqs: [
		notice('olaf-only', {campus: 'stolaf.edu'}),
		notice('carls-only', {campus: 'carleton.edu'}),
		notice('everyone'),
	],
}

const ids = (data: {faqs: Array<{id: string}>}) => data.faqs.map((faq) => faq.id)

describe('one notices list for both apps', () => {
	test("St. Olaf's app shows its own notices and those for everyone", () => {
		expect(ids(faqsFor(LIST, 'stolaf'))).toEqual(['olaf-only', 'everyone'])
	})

	test("Carleton's app shows its own notices and those for everyone", () => {
		expect(ids(faqsFor(LIST, 'carleton'))).toEqual(['carls-only', 'everyone'])
	})

	test("keeps All About Olaf's free-form text out of CARLS", () => {
		expect(faqsFor(LIST, 'stolaf').legacyText).toBe('All About Olaf’s own text')
		expect(faqsFor(LIST, 'carleton').legacyText).toBe('')
	})

	test("falls back on the bundled copy's notices when the server sends none for the campus", () => {
		let answer = {faqs: [notice('olaf-only', {campus: 'stolaf.edu'})]}
		expect(faqsFor(answer, 'carleton')).toEqual(faqsFor(null, 'carleton'))
	})
})
