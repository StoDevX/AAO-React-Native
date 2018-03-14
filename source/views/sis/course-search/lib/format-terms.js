// @flow
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import mapValues from 'lodash/mapValues'
import toPairs from 'lodash/toPairs'

//example: [20171,20173,20154,20153] -> "17/18: Fall/Spr, "15/16: Spr/Sum1""

export function formatTerms(terms: Array<number>): string {
	const sortedTerms = sortBy(terms)
	const formattedTerms = sortedTerms.map(term =>
		parseTermAbbrev(term.toString()),
	)
	const groupedTerms = groupBy(formattedTerms, term => term.year)
	const groupedDescriptions = mapValues(groupedTerms, terms => {
		const semesters = terms.map(term => term.semester)
		return semesters.join('/')
	})
	const finalDescription = toPairs(groupedDescriptions)
		.map(year => year.join(': '))
		.join(', ')
	return finalDescription
}

type TermAbbrevType = {
	year: string,
	semester: string,
}

function parseTermAbbrev(term: string): TermAbbrevType {
	const semester = term.slice(-1)
	const year = term.slice(0, -1)
	const currentYear = parseInt(year)
	const currentYearAbbrev = year.slice(-2)
	const nextYear = (currentYear + 1).toString().slice(-2)
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
