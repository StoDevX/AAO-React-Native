import {describe, expect, it} from '@jest/globals'
import {findOpenService} from '../find-open-service'
import {plainMoment} from './moment.helper'
import {BuildingType} from '../../types'

let at = (date: string, time: string) => plainMoment(`${date}T${time}`, 'YYYY-MM-DD[T]HH:mm:ss')

// data/building-hours/7-3-sarn.yaml
const sarn: BuildingType = {
	name: 'SARN',
	category: 'Health and Wellness',
	schedule: [
		{
			title: 'Office',
			hours: [{days: ['Tu'], from: '7:00pm', to: '8:00pm'}],
		},
		{
			title: 'Phone',
			isPhysicallyOpen: false,
			status: {symbol: 'phone.circle', name: 'Phone'},
			hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], from: '8:00pm', to: '8:00am'}],
		},
	],
}

// 2026-09-08 is a Tuesday.
describe('a service that is running', () => {
	it('returns what it calls itself', () => {
		expect(findOpenService(sarn, at('2026-09-08', '22:00:00'))).toEqual({
			symbol: 'phone.circle',
			name: 'Phone',
		})
	})

	it('returns it in the small hours, when the window carried over', () => {
		expect(findOpenService(sarn, at('2026-09-09', '03:00:00'))?.name).toBe('Phone')
	})
})

describe('no service to report', () => {
	it('returns null when the service window is not running', () => {
		expect(findOpenService(sarn, at('2026-09-08', '14:00:00'))).toBeNull()
	})

	it('returns null for a set that is a door', () => {
		let building: BuildingType = {
			name: 'B',
			category: 'C',
			schedule: [{title: 'Hours', hours: [{days: ['Tu'], from: '8:00am', to: '9:00pm'}]}],
		}
		expect(findOpenService(building, at('2026-09-08', '14:00:00'))).toBeNull()
	})

	it('returns null when a non-door set never said what it is', () => {
		let building: BuildingType = {
			name: 'B',
			category: 'C',
			schedule: [
				{
					title: 'Phone',
					isPhysicallyOpen: false,
					hours: [{days: ['Tu'], from: '8:00am', to: '9:00pm'}],
				},
			],
		}
		expect(findOpenService(building, at('2026-09-08', '14:00:00'))).toBeNull()
	})
})
