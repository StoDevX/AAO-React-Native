// @flow

export function parseTerm(term: string) {
	const semester = term.slice(-1)
	const year = term.slice(0, -1)
	const currentYear = parseInt(year)
	const nextYear = (currentYear + 1).toString().slice(-2)
	switch (semester) {
		case '0':
			return `Abroad ${currentYear}/${nextYear}`
		case '1':
			return `Fall ${currentYear}/${nextYear}`
		case '2':
			return `Interim ${currentYear}/${nextYear}`
		case '3':
			return `Spring ${currentYear}/${nextYear}`
		case '4':
			return `Summer Term 1 ${currentYear}/${nextYear}`
		case '5':
			return `Summer Term 2 ${currentYear}/${nextYear}`
		case '9':
			return `Non-St. Olaf ${currentYear}/${nextYear}`
		default:
			return 'Unknown term'
	}
}
