import {toLaxTitleCase} from '@frogpond/titlecase'

export function trimStationName(stationName: string): string {
	return stationName.replace(/<strong>@(.*)<\/strong>/u, '$1')
}

function removeParenTags(str: string) {
	let parensRegex = /\s?\([^)]*?\)\s?$/u
	while (parensRegex.test(str)) {
		str = str.replace(parensRegex, '')
	}
	return str
}

export function trimItemLabel(label: string): string {
	// remove extraneous whitespace and title-case the bonapp titles
	let evenedWhitespace = label.replaceAll(/\s+/gu, ' ')
	let noParens = removeParenTags(evenedWhitespace)
	return toLaxTitleCase(noParens)
}
