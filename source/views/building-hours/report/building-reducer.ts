import type {
	BuildingType,
	NamedBuildingScheduleType,
	SingleBuildingScheduleType,
} from '../types'
import {blankSchedule} from '../lib'

export type BuildingAction =
	| {type: 'SET_BUILDING_NAME'; name: string}
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

export function buildingReducer(
	state: BuildingType,
	action: BuildingAction,
): BuildingType {
	switch (action.type) {
		case 'SET_BUILDING_NAME':
			return {...state, name: action.name}

		case 'ADD_SCHEDULE':
			return {
				...state,
				schedule: [
					...state.schedule,
					{title: 'Hours', hours: [blankSchedule()]},
				],
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

		default: {
			let _exhaustive: never = action
			throw new Error(
				`Unhandled building action: ${JSON.stringify(_exhaustive)}`,
			)
		}
	}
}
