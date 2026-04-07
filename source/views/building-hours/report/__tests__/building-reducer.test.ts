import {buildingReducer, BuildingAction} from '../overview'
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
	it('handles EDIT_NAME', () => {
		let action: BuildingAction = {type: 'EDIT_NAME', name: 'New Name'}
		let result = buildingReducer(baseBuilding, action)
		expect(result.name).toBe('New Name')
		expect(result.schedule).toBe(baseBuilding.schedule)
	})

	it('handles EDIT_SCHEDULE', () => {
		let newSchedule = {
			...baseBuilding.schedule[0],
			title: 'Updated Hours',
		}
		let action: BuildingAction = {
			type: 'EDIT_SCHEDULE',
			index: 0,
			schedule: newSchedule,
		}
		let result = buildingReducer(baseBuilding, action)
		expect(result.schedule[0].title).toBe('Updated Hours')
	})

	it('handles DELETE_SCHEDULE', () => {
		let action: BuildingAction = {type: 'DELETE_SCHEDULE', index: 0}
		let result = buildingReducer(baseBuilding, action)
		expect(result.schedule).toHaveLength(0)
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

	it('handles ADD_HOURS_ROW', () => {
		let action: BuildingAction = {
			type: 'ADD_HOURS_ROW',
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

	it('handles EDIT_HOURS_ROW', () => {
		let newHours = {
			days: ['Sa' as const, 'Su' as const],
			from: '10:00am',
			to: '4:00pm',
		}
		let action: BuildingAction = {
			type: 'EDIT_HOURS_ROW',
			scheduleIndex: 0,
			setIndex: 0,
			data: newHours,
		}
		let result = buildingReducer(baseBuilding, action)
		expect(result.schedule[0].hours[0]).toEqual(newHours)
	})

	it('handles DELETE_HOURS_ROW', () => {
		let action: BuildingAction = {
			type: 'DELETE_HOURS_ROW',
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
		buildingReducer(baseBuilding, {type: 'EDIT_NAME', name: 'Changed'})
		expect(baseBuilding).toEqual(original)
	})
})
