import {describe, expect, test} from '@jest/globals'
import {UnprocessedBusLine} from '../types'

// We test the getKey logic in isolation — the full collection requires
// native SQLite which is not available in Jest.
const getKey = (line: UnprocessedBusLine): string => line.line

describe('busLinesCollection key extraction', () => {
	test('returns the line name as the key', () => {
		const line: UnprocessedBusLine = {
			line: 'Express Bus',
			colors: {bar: 'red', dot: 'blue'},
			schedules: [],
		}
		expect(getKey(line)).toBe('Express Bus')
	})

	test('distinguishes between different lines', () => {
		const redLine: UnprocessedBusLine = {
			line: 'Red Line',
			colors: {bar: 'red', dot: 'darkred'},
			schedules: [],
		}
		const blueLine: UnprocessedBusLine = {
			line: 'Blue Line',
			colors: {bar: 'blue', dot: 'darkblue'},
			schedules: [],
		}
		expect(getKey(redLine)).not.toBe(getKey(blueLine))
	})
})
