import {unitNumber, unitNumberOfDescription} from '../parsers/unit-number'

describe('unitNumber', () => {
	test('reads a plain five-digit unit', () => {
		expect(unitNumber('11725')).toBe('11725')
	})

	test('drops a two- or three-digit fund prefix', () => {
		expect(unitNumber('10-13001')).toBe('13001')
		expect(unitNumber('010-11725')).toBe('11725')
	})

	test('takes the first of two units', () => {
		expect(unitNumber('10-13001 / 10-13000')).toBe('13001')
	})

	test('ignores zero-width characters and spaces', () => {
		expect(unitNumber('\u200B 11150 ')).toBe('11150')
	})

	test.each(['', 'n/a', '11-707', '1172', '117250'])('is null for %j', (value) => {
		expect(unitNumber(value)).toBeNull()
	})
})

describe('unitNumberOfDescription', () => {
	// ccc-server reads the same input the same way; see its unit-number tests.
	test('keeps a unit apart from a paragraph that follows with no space', () => {
		let html = '<p><strong>Unit Number:</strong> 11725</p><p>2026-27 academic year</p>'

		expect(unitNumberOfDescription(html)).toBe('11725')
	})
})
