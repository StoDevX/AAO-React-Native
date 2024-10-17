import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import mapValues from 'lodash/mapValues'
import toPairs from 'lodash/toPairs'

//example: [20171,20173,20154,20153] -> "17/18: Fall/Spr, "15/16: Spr/Sum1""

export function formatTerms(terms: number[]): string {
	let sortedTerms = sortBy(terms)
	let formattedTerms = sortedTerms.map((term) =>
		parseTermAbbrev(term.toString()),
	)
	let groupedTerms = groupBy(formattedTerms, (term) => term.year)
	let groupedDescriptions = mapValues(groupedTerms, (abbreviatedTerms) => {
		let semesters = abbreviatedTerms.map((term) => term.semester)
		return semesters.join('/')
	})
	let finalDescription = toPairs(groupedDescriptions)
		.map((year) => year.join(': '))
		.join(', ')
	return finalDescription
}

interface TermAbbrevType {
	year: string
	semester: string
}

function parseTermAbbrev(term: string): TermAbbrevType {
	let semester = term.slice(-1)
	let year = term.slice(0, -1)
	let currentYear = parseInt(year, 10)
	let currentYearAbbrev = year.slice(-2)
	let nextYear = (currentYear + 1).toString().slice(-2)
	switch (semester) {
		case '0':
			return {year: `${currentYearAbbrev}/${nextYear}`, semester: 'Abr'}
		case '1':
			return {year: `${currentYearAbbrev}/${nextYear}`, semester: 'Fall'}
		case '2':
			return {year: `${currentYearAbbrev}/${nextYear}`, semester: 'Int'}
		case '3':
			return {year: `${currentYearAbbrev}/${nextYear}`, semester: 'Spr'}
		case '4':
			return {year: `${currentYearAbbrev}/${nextYear}`, semester: 'Sum1'}
		case '5':
			return {year: `${currentYearAbbrev}/${nextYear}`, semester: 'Sum2'}
		case '9':
			return {year: `${currentYearAbbrev}/${nextYear}`, semester: 'Non-Sto'}
		default:
			return {year: `${currentYearAbbrev}/${nextYear}`, semester: 'Unk'}
	}
}
