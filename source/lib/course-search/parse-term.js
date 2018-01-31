// @flow

export function parseTerm(term: string) {
	const semester = parseInt(term.slice(-1, term.length))
	const year = term.slice(0, term.length - 1)
	switch (semester) {
		case 1:
			return 'Fall ' + year
		case 2:
			return 'Interim ' + year
		case 3:
			return 'Spring ' + year
		case 4:
			return 'Summer Session 1 ' + year
		case 5:
			return 'Summer Session 2 ' + year
		default:
			return 'No term found'
	}
}
