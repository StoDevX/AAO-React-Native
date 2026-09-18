import type {
	BuildingLinkType,
	BuildingType,
	NamedBuildingScheduleType,
	SingleBuildingScheduleType,
} from '../types'
import {blankSchedule} from '../lib'

export type BuildingAction =
	| {type: 'UPDATE_BUILDING'; data: Partial<BuildingType>}
	| {type: 'ADD_SCHEDULE'}
	| {
			type: 'UPDATE_SCHEDULE'
			scheduleIndex: number
			data: Partial<NamedBuildingScheduleType>
	  }
	| {type: 'DELETE_SCHEDULE'; scheduleIndex: number}
	| {type: 'ADD_HOURS'; scheduleIndex: number}
	| {
			type: 'SET_HOURS'
			scheduleIndex: number
			setIndex: number
			data: SingleBuildingScheduleType
	  }
	| {type: 'DELETE_HOURS'; scheduleIndex: number; setIndex: number}
	| {type: 'ADD_LINK'}
	| {type: 'UPDATE_LINK'; linkIndex: number; data: Partial<BuildingLinkType>}
	| {type: 'DELETE_LINK'; linkIndex: number}

/**
 * The optional free-text fields, which a reporter clearing a field means to
 * remove rather than to blank. `name` and `category` are required, so an empty
 * one stays empty and shows as the mistake it is.
 */
const OPTIONAL_TEXT_KEYS = ['subtitle', 'abbreviation'] as const

export function buildingReducer(state: BuildingType, action: BuildingAction): BuildingType {
	switch (action.type) {
		case 'UPDATE_BUILDING': {
			let next = {...state, ...action.data}
			for (let key of OPTIONAL_TEXT_KEYS) {
				if (next[key] === '') {
					delete next[key]
				}
			}
			return next
		}

		case 'ADD_SCHEDULE':
			return {
				...state,
				schedule: [...state.schedule, {title: 'Hours', hours: [blankSchedule()]}],
			}

		case 'UPDATE_SCHEDULE': {
			let schedules = [...state.schedule]
			schedules[action.scheduleIndex] = {
				...schedules[action.scheduleIndex],
				...action.data,
			}
			return {...state, schedule: schedules}
		}

		case 'DELETE_SCHEDULE': {
			let schedules = [...state.schedule]
			schedules.splice(action.scheduleIndex, 1)
			return {...state, schedule: schedules}
		}

		case 'ADD_HOURS': {
			let schedules = [...state.schedule]
			schedules[action.scheduleIndex] = {
				...schedules[action.scheduleIndex],
				hours: [...schedules[action.scheduleIndex].hours, blankSchedule()],
			}
			return {...state, schedule: schedules}
		}

		case 'SET_HOURS': {
			let schedules = [...state.schedule]
			let hours = [...schedules[action.scheduleIndex].hours]
			hours[action.setIndex] = action.data
			schedules[action.scheduleIndex] = {
				...schedules[action.scheduleIndex],
				hours,
			}
			return {...state, schedule: schedules}
		}

		case 'DELETE_HOURS': {
			let schedules = [...state.schedule]
			let hours = [...schedules[action.scheduleIndex].hours]
			hours.splice(action.setIndex, 1)
			schedules[action.scheduleIndex] = {
				...schedules[action.scheduleIndex],
				hours,
			}
			return {...state, schedule: schedules}
		}

		case 'ADD_LINK':
			return {...state, links: [...(state.links ?? []), {title: '', url: ''}]}

		case 'UPDATE_LINK': {
			let links = [...(state.links ?? [])]
			links[action.linkIndex] = {...links[action.linkIndex], ...action.data}
			return {...state, links}
		}

		case 'DELETE_LINK': {
			let links = [...(state.links ?? [])]
			links.splice(action.linkIndex, 1)
			// An empty `links: []` in the emailed YAML reads as a deliberate
			// clearing of every link, not the absence of any -- so a building
			// left with none goes back to having no `links` key at all.
			if (links.length === 0) {
				let {links: _links, ...rest} = state
				return rest
			}
			return {...state, links}
		}

		default: {
			let _exhaustive: never = action
			throw new Error(`Unhandled building action: ${JSON.stringify(_exhaustive)}`)
		}
	}
}
