import {citationLine} from '../citations'

const HISTORY = {label: 'History of the Natural Lands', href: 'https://x/history/'}
const HABITATS = {
	label: 'Habitats and Management of the Natural Lands',
	href: 'https://x/habitats/',
}

describe('citationLine', () => {
	it('names one source', () => {
		expect(citationLine([HISTORY])).toBe(
			'Source: [History of the Natural Lands](https://x/history/)',
		)
	})

	it('names several, joined by a middle dot', () => {
		expect(citationLine([HISTORY, HABITATS])).toBe(
			'Sources: [History of the Natural Lands](https://x/history/) · ' +
				'[Habitats and Management of the Natural Lands](https://x/habitats/)',
		)
	})

	it('has nothing to say without citations', () => {
		expect(citationLine([])).toBeNull()
		expect(citationLine(null)).toBeNull()
		expect(citationLine(undefined)).toBeNull()
	})

	it('drops a citation with no href', () => {
		expect(citationLine([{label: 'Loose', href: ''}, HISTORY])).toBe(
			'Source: [History of the Natural Lands](https://x/history/)',
		)
	})

	it('keeps a bracket in a label inside its link', () => {
		expect(citationLine([{label: 'Map [2024]', href: 'https://x/m'}])).toBe(
			'Source: [Map \\[2024\\]](https://x/m)',
		)
	})

	it('keeps a parenthesis in an href from ending the link', () => {
		expect(citationLine([{label: 'Map', href: 'https://x/m(1)'}])).toBe(
			'Source: [Map](https://x/m%281%29)',
		)
	})
})
