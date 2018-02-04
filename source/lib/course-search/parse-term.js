// @flow

export function parseTerm(term: string) {
	const semester = parseInt(term.slice(-1, term.length))
	const year = term.slice(0, term.length - 1)
	const currentYear = parseInt(year)
	switch (semester) {
		case 0:
			return `Abroad ${currentYear}/${currentYear + 1}`
		case 1:
			return `Fall ${currentYear}/${currentYear + 1}`
		case 2:
			return `Interim ${currentYear}/${currentYear + 1}`
		case 3:
			return `Spring ${currentYear}/${currentYear + 1}`
		case 4:
			return `Summer Term 1 ${currentYear}/${currentYear + 1}`
		case 5:
			return `Summer Term 2 ${currentYear}/${currentYear + 1}`
		case 9:
			return `Non-St. Olaf ${currentYear}/${currentYear + 1}`
		default:
			return 'No term found'
	}
}
