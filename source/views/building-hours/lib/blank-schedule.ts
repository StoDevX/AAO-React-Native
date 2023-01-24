import {SingleBuildingScheduleType} from '../types'

export const blankSchedule = (): SingleBuildingScheduleType => ({
	days: [],
	from: '9:00am',
	to: '5:00pm',
})
