// @flow

export function formatDay(day: string) {
	switch (day) {
		case 'Mo':
			return 'Monday'
		case 'Tu':
			return 'Tuesday'
		case 'We':
			return 'Wednesday'
		case 'Th':
			return 'Thursday'
		case 'Fr':
			return 'Friday'
		default:
			return day
	}
}

export function formatDayAbbrev(day: string) {
	switch (day) {
		case 'Mo':
			return 'M'
		case 'Tu':
			return 'T'
		case 'We':
			return 'W'
		case 'Th':
			return 'Th'
		case 'Fr':
			return 'F'
		default:
			return day
	}
}
