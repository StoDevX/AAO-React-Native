import {formatNumber} from '../call-phone'
import {describe, expect, it} from '@jest/globals'

describe('formatNumber', () => {
	it('should return the same if not formattable', () => {
		expect(formatNumber('')).toBe('')
		expect(formatNumber('7866789')).toBe('7866789')
	})

	it('should format with dashes and parentheses', () => {
		let formatted = '(507) 786-6789'
		expect(formatNumber('5077866789')).toBe(formatted)
		expect(formatNumber('507-786-6789')).toBe(formatted)
		expect(formatNumber('(507)-786-6789')).toBe(formatted)
	})

	it('should format prefixed +1 with dashes and parentheses', () => {
		let formatted = '+1 (507) 786-6789'
		expect(formatNumber('+15077866789')).toBe(formatted)
		expect(formatNumber('15077866789')).toBe(formatted)
		expect(formatNumber('15077866789')).toBe(formatted)
		expect(formatNumber('1507-786-6789')).toBe(formatted)
		expect(formatNumber('1(507)-786-6789')).toBe(formatted)
	})
})
