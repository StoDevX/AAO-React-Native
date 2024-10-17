import {startCase} from 'lodash'

export function trimStationName(stationName: string): string {
	return stationName.replace(/<strong>@(.*)<\/strong>/u, '$1')
}

function removeParenTags(str: string) {
	let parensRegex = /\s?\([^)]*?\)\s?$/u
	while (parensRegex.exec(str)) {
		str = str.replace(parensRegex, '')
	}
	return str
}

export function trimItemLabel(label: string): string {
	// remove extraneous whitespace and title-case the bonapp titles
	let evenedWhitespace = label.replace(/\s+/gu, ' ')
	let noParens = removeParenTags(evenedWhitespace)
	return startCase(noParens)
}
