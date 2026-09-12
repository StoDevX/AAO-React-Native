import {describe, expect, it} from '@jest/globals'
import {firstScheduleNote, hasDisplayableHours} from '../schedule-summary'
import {NamedBuildingScheduleType} from '../../types'

const withHours: NamedBuildingScheduleType = {
	title: 'Hours',
	hours: [{days: ['Mo'], from: '8:00am', to: '5:00pm'}],
}
const noticeOnly: NamedBuildingScheduleType = {
	title: 'Hours',
	notes: 'Closed for renovation until spring.',
	hours: [],
}

describe('hasDisplayableHours', () => {
	it('is true when any set lists an hour', () => {
		expect(hasDisplayableHours([withHours])).toBe(true)
	})

	it('is true when a later set lists an hour and an earlier one does not', () => {
		expect(hasDisplayableHours([noticeOnly, withHours])).toBe(true)
	})

	it('is false when every set is empty', () => {
		expect(hasDisplayableHours([noticeOnly])).toBe(false)
	})

	it('is false for a building with no schedule at all', () => {
		expect(hasDisplayableHours([])).toBe(false)
	})
})

describe('firstScheduleNote', () => {
	it('returns the note from the first set that carries one', () => {
		expect(firstScheduleNote([withHours, noticeOnly])).toBe('Closed for renovation until spring.')
	})

	it('returns undefined when no set carries a note', () => {
		expect(firstScheduleNote([withHours])).toBeUndefined()
	})

	it('returns undefined for a building with no schedule at all', () => {
		expect(firstScheduleNote([])).toBeUndefined()
	})
})
