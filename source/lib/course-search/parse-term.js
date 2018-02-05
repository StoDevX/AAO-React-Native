// @flow

export function parseTerm(term: string) {
	const semester = parseInt(term.slice(-1, term.length))
	const year = term.slice(0, term.length - 1)
	const currentYear = parseInt(year)
	const nextYear = (currentYear + 1).toString()
	const nextYearAbbrev = nextYear.slice(-2, nextYear.length)
	switch (semester) {
		case 0:
			return `Abroad ${currentYear}/${nextYearAbbrev}`
		case 1:
			return `Fall ${currentYear}/${nextYearAbbrev}`
		case 2:
			return `Interim ${currentYear}/${nextYearAbbrev}`
		case 3:
			return `Spring ${currentYear}/${nextYearAbbrev}`
		case 4:
			return `Summer Term 1 ${currentYear}/${nextYearAbbrev}`
		case 5:
			return `Summer Term 2 ${currentYear}/${nextYearAbbrev}`
		case 9:
			return `Non-St. Olaf ${currentYear}/${nextYearAbbrev}`
		default:
			return 'No term found'
	}
}
