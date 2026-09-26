import type {Moment} from 'moment-timezone'
import type {DayOfWeek} from '../types'

export const DAYS_OF_WEEK: Array<{day: DayOfWeek; label: string}> = [
	{day: 'Su', label: 'Sunday'},
	{day: 'Mo', label: 'Monday'},
	{day: 'Tu', label: 'Tuesday'},
	{day: 'We', label: 'Wednesday'},
	{day: 'Th', label: 'Thursday'},
	{day: 'Fr', label: 'Friday'},
	{day: 'Sa', label: 'Saturday'},
]

export const momentToDayOfWeek = (moment: Moment): DayOfWeek => {
	const dayMap: Record<number, DayOfWeek> = {
		0: 'Su',
		1: 'Mo',
		2: 'Tu',
		3: 'We',
		4: 'Th',
		5: 'Fr',
		6: 'Sa',
	}
	return dayMap[moment.day()]
}

export const createMomentForDay = (baseMoment: Moment, targetDay: DayOfWeek): Moment => {
	const dayMap: Record<DayOfWeek, number> = {
		Su: 0,
		Mo: 1,
		Tu: 2,
		We: 3,
		Th: 4,
		Fr: 5,
		Sa: 6,
	}

	const targetDayNumber = dayMap[targetDay]
	const currentDayNumber = baseMoment.day()
	const diff = targetDayNumber - currentDayNumber

	return baseMoment.clone().add(diff, 'days')
}
