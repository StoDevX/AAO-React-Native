import {buildingReducer} from '../building-reducer'
import type {BuildingAction} from '../building-reducer'
import type {BuildingType} from '../../types'

const baseBuilding: BuildingType = {
	name: 'Test Hall',
	category: 'academic',
	schedule: [
		{
			title: 'Regular Hours',
			hours: [
				{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'},
			],
		},
	],
}

describe('buildingReducer', () => {
	it('handles SET_BUILDING_NAME', () => {
		let action: BuildingAction = {type: 'SET_BUILDING_NAME', name: 'New Name'}
		let result = buildingReducer(baseBuilding, action)
		expect(result.name).toBe('New Name')
		expect(result.schedule).toBe(baseBuilding.schedule)
	})

	it('handles ADD_SCHEDULE', () => {
		let action: BuildingAction = {type: 'ADD_SCHEDULE'}
		let result = buildingReducer(baseBuilding, action)
		expect(result.schedule).toHaveLength(2)
		expect(result.schedule[1].title).toBe('Hours')
		expect(result.schedule[1].hours).toHaveLength(1)
		expect(result.schedule[1].hours[0]).toEqual({
			days: [],
			from: '9:00am',
			to: '5:00pm',
		})
	})

	it('handles UPDATE_SCHEDULE', () => {
		let action: BuildingAction = {
			type: 'UPDATE_SCHEDULE',
			scheduleIndex: 0,
			data: {title: 'Partial Update'},
		}
		let result = buildingReducer(baseBuilding, action)
		expect(result.schedule[0].title).toBe('Partial Update')
		// other fields preserved
		expect(result.schedule[0].hours).toBe(baseBuilding.schedule[0].hours)
	})

	it('handles DELETE_SCHEDULE', () => {
		let action: BuildingAction = {type: 'DELETE_SCHEDULE', scheduleIndex: 0}
		let result = buildingReducer(baseBuilding, action)
		expect(result.schedule).toHaveLength(0)
	})

	it('handles ADD_HOURS', () => {
		let action: BuildingAction = {
			type: 'ADD_HOURS',
			scheduleIndex: 0,
		}
		let result = buildingReducer(baseBuilding, action)
		expect(result.schedule[0].hours).toHaveLength(2)
		expect(result.schedule[0].hours[1]).toEqual({
			days: [],
			from: '9:00am',
			to: '5:00pm',
		})
	})

	it('handles SET_HOURS', () => {
		let newHours = {
			days: ['Sa' as const, 'Su' as const],
			from: '10:00am',
			to: '4:00pm',
		}
		let action: BuildingAction = {
			type: 'SET_HOURS',
			scheduleIndex: 0,
			setIndex: 0,
			data: newHours,
		}
		let result = buildingReducer(baseBuilding, action)
		expect(result.schedule[0].hours[0]).toEqual(newHours)
	})

	it('handles DELETE_HOURS', () => {
		let action: BuildingAction = {
			type: 'DELETE_HOURS',
			scheduleIndex: 0,
			setIndex: 0,
		}
		let result = buildingReducer(baseBuilding, action)
		expect(result.schedule[0].hours).toHaveLength(0)
	})

	it('does not mutate the original state', () => {
		let original: BuildingType = JSON.parse(
			JSON.stringify(baseBuilding),
		) as BuildingType
		buildingReducer(baseBuilding, {type: 'SET_BUILDING_NAME', name: 'Changed'})
		expect(baseBuilding).toEqual(original)
	})
})
