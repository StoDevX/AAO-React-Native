import {getElementsByTagName, parseXml, textContent} from '../index'

describe('parseXml', () => {
	it('parses namespaced tag names as literal (colon-containing) names', () => {
		const doc = parseXml('<item><dc:creator>Jane Doe</dc:creator></item>')
		const [creator] = getElementsByTagName('dc:creator', doc)
		expect(creator).toBeDefined()
		expect(textContent(creator)).toBe('Jane Doe')
	})

	it('decodes CDATA sections as plain text content', () => {
		const doc = parseXml('<title><![CDATA[Bread & Butter]]></title>')
		const [title] = getElementsByTagName('title', doc)
		expect(textContent(title)).toBe('Bread & Butter')
	})

	it('treats self-closing tags as empty elements', () => {
		const doc = parseXml('<enclosure url="https://example.test/a.png" type="image/png" />')
		const [enclosure] = getElementsByTagName('enclosure', doc)
		expect(enclosure.attribs.url).toBe('https://example.test/a.png')
		expect(enclosure.attribs.type).toBe('image/png')
	})
})
