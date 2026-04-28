import {describe, expect, test} from '@jest/globals'
import {OtherModeType} from '../../types'

const getKey = (mode: OtherModeType): string => mode.name

describe('otherModesCollection key extraction', () => {
	test('returns the mode name as the key', () => {
		const mode: OtherModeType = {
			name: 'Northfield Transit',
			synopsis: 'Local bus service',
			url: 'https://example.com',
			category: 'Bus',
		}
		expect(getKey(mode)).toBe('Northfield Transit')
	})

	test('distinguishes between different modes', () => {
		const bus: OtherModeType = {
			name: 'Northfield Transit',
			synopsis: '',
			url: '',
			category: 'Bus',
		}
		const rideshare: OtherModeType = {
			name: 'Lyft',
			synopsis: '',
			url: '',
			category: 'Rideshare',
		}
		expect(getKey(bus)).not.toBe(getKey(rideshare))
	})
})
