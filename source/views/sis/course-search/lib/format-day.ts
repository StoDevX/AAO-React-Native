export function formatDay(day: string): string {
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
		case 'Sa':
			return 'Saturday'
		case 'Su':
			return 'Sunday'
		default:
			return day
	}
}

export function formatDayAbbrev(day: string): string {
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
