import {buildingReducer, type BuildingAction} from '../building-reducer'
import type {BuildingType} from '../../types'

const baseBuilding: BuildingType = {
	name: 'Test Hall',
	category: 'academic',
	schedule: [
		{
			title: 'Regular Hours',
			hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
		},
	],
}

describe('buildingReducer', () => {
	it('handles UPDATE_BUILDING', () => {
		let action: BuildingAction = {type: 'UPDATE_BUILDING', data: {name: 'New Name'}}
		let result = buildingReducer(baseBuilding, action)
		expect(result.name).toBe('New Name')
		expect(result.schedule).toBe(baseBuilding.schedule)
	})

	it('sets a subtitle through UPDATE_BUILDING', () => {
		let action: BuildingAction = {
			type: 'UPDATE_BUILDING',
			data: {subtitle: 'Digital Scholarship Center'},
		}
		let result = buildingReducer(baseBuilding, action)
		expect(result.subtitle).toBe('Digital Scholarship Center')
	})

	// A cleared optional field must leave no key behind: `subtitle: ''` in the
	// emailed YAML reads as a deliberate empty formal name, not an absent one.
	it('drops an optional field cleared to an empty string', () => {
		let withSubtitle = {...baseBuilding, subtitle: 'Old Name', abbreviation: 'ON'}
		let result = buildingReducer(withSubtitle, {type: 'UPDATE_BUILDING', data: {subtitle: ''}})
		expect('subtitle' in result).toBe(false)
		expect(result.abbreviation).toBe('ON')
	})

	it('keeps a cleared name, which is required', () => {
		let result = buildingReducer(baseBuilding, {type: 'UPDATE_BUILDING', data: {name: ''}})
		expect(result.name).toBe('')
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
		let original: BuildingType = JSON.parse(JSON.stringify(baseBuilding)) as BuildingType
		buildingReducer(baseBuilding, {type: 'UPDATE_BUILDING', data: {name: 'Changed'}})
		expect(baseBuilding).toEqual(original)
	})
})

describe('links', () => {
	let withLinks: BuildingType = {
		...baseBuilding,
		links: [{title: 'Instagram', url: 'https://instagram.com/lionspause'}],
	}

	it('handles ADD_LINK on a building with no links', () => {
		let result = buildingReducer(baseBuilding, {type: 'ADD_LINK'})
		expect(result.links).toEqual([{title: '', url: ''}])
	})

	it('handles ADD_LINK on a building that already has one', () => {
		let result = buildingReducer(withLinks, {type: 'ADD_LINK'})
		expect(result.links).toHaveLength(2)
		expect(result.links?.[0].title).toBe('Instagram')
	})

	it('handles UPDATE_LINK', () => {
		let result = buildingReducer(withLinks, {
			type: 'UPDATE_LINK',
			linkIndex: 0,
			data: {title: 'Pause Instagram'},
		})
		expect(result.links?.[0]).toEqual({
			title: 'Pause Instagram',
			url: 'https://instagram.com/lionspause',
		})
	})

	it('handles DELETE_LINK', () => {
		let withTwoLinks: BuildingType = {
			...baseBuilding,
			links: [
				{title: 'Instagram', url: 'https://instagram.com/lionspause'},
				{title: 'Facebook', url: 'https://facebook.com/lionspause'},
			],
		}
		let result = buildingReducer(withTwoLinks, {type: 'DELETE_LINK', linkIndex: 0})
		expect(result.links).toEqual([{title: 'Facebook', url: 'https://facebook.com/lionspause'}])
	})

	// An empty `links: []` in the emailed YAML reads as a deliberate clearing
	// of every link, and leaves `hasUnsavedChanges` stuck true forever since
	// the building no longer round-trips to its initial, key-less shape.
	it('drops the links key entirely when DELETE_LINK empties the array', () => {
		let result = buildingReducer(withLinks, {type: 'DELETE_LINK', linkIndex: 0})
		expect('links' in result).toBe(false)
	})
})
