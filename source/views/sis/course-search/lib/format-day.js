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
		case 'Sa':
			return 'Saturday'
		case 'Su':
			return 'Sunday'
		default:
			return 'Unknown Day'
	}
}
