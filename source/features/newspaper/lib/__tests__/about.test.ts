import {describe, expect, it} from '@jest/globals'
import aboutPage from '../../__tests__/fixtures/about-page.json'
import {parseAboutPage} from '../about'

/** Builds a pages response holding one page with the given body. */
const page = (rendered: string) => [{content: {rendered}}]

describe('parseAboutPage', () => {
	it('reads each heading of the paper’s About page as a section, in order', () => {
		let sections = parseAboutPage(aboutPage)
		expect(sections.map((section) => section.title)).toStrictEqual([
			'For general inquiries',
			'Advertising requests',
			'By section',
			'Photo/visual inquiries',
			'Submission Policy',
		])
	})

	it('reads a paragraph naming a role and an address as a contact', () => {
		let [, , bySection] = parseAboutPage(aboutPage)
		expect(bySection).toStrictEqual({
			title: 'By section',
			contacts: [
				{role: 'News Editors', email: 'mess-news@stolaf.edu'},
				{role: 'Opinions Editors', email: 'mess-opinion@stolaf.edu'},
				{role: 'Arts and Entertainment Editors', email: 'mess-ae@stolaf.edu'},
				{role: 'Sports Editor', email: 'mess-sports@stolaf.edu'},
				{role: 'Variety Editor', email: 'mess-variety@stolaf.edu'},
			],
			paragraphs: [],
		})
	})

	it('joins a role set in more than one bold run', () => {
		let photo = parseAboutPage(aboutPage)[3]
		expect(photo?.contacts[1]).toStrictEqual({
			role: 'Visual Director',
			email: 'mess-visual@stolaf.edu',
		})
	})

	it('drops a blank paragraph rather than adding it to its section', () => {
		let photo = parseAboutPage(aboutPage)[3]
		expect(photo?.paragraphs).toStrictEqual([])
	})

	it('reads a paragraph with no address as prose', () => {
		let policy = parseAboutPage(aboutPage)[4]
		expect(policy?.contacts).toStrictEqual([])
		expect(policy?.paragraphs).toHaveLength(7)
		expect(policy?.paragraphs[0]).toMatch(/^The Olaf Messenger encourages contributions/u)
		expect(policy?.paragraphs[6]).toMatch(/Postage is paid in Northfield\.$/u)
	})

	it('decodes entities in a heading and its text', () => {
		let [section] = parseAboutPage(page('<h2>Q&amp;A…</h2><p>Tom &amp; Jerry</p>'))
		expect(section).toStrictEqual({title: 'Q&A', contacts: [], paragraphs: ['Tom & Jerry']})
	})

	it('keeps an address’s own text out of its role', () => {
		let [section] = parseAboutPage(
			page('<h2>Tips</h2><p>Send tips to <a href="mailto:tips@stolaf.edu">tips@stolaf.edu</a></p>'),
		)
		expect(section?.contacts).toStrictEqual([{role: 'Send tips to', email: 'tips@stolaf.edu'}])
	})

	it('reads an address from its link, not the text shown for it', () => {
		let [section] = parseAboutPage(
			page(
				'<h2>Tips</h2><p><strong>Tips</strong> <a href="mailto:tips@stolaf.edu?subject=Hi">Email us</a></p>',
			),
		)
		expect(section?.contacts).toStrictEqual([{role: 'Tips', email: 'tips@stolaf.edu'}])
	})

	it('fails when no page has the slug, so the screen shows an error rather than nothing', () => {
		expect(() => parseAboutPage([])).toThrow('The Olaf Messenger has no About page')
	})

	it('fails when the page has no headings to make sections of', () => {
		expect(() => parseAboutPage(page('<p>Hello</p>'))).toThrow(
			'The Olaf Messenger’s About page has no sections',
		)
	})
})
