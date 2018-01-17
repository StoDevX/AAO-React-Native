// @flow
import {toLaxTitleCase} from 'titlecase'

export function trimStationName(stationName: string) {
	return stationName.replace(/<strong>@(.*)<\/strong>/, '$1')
}

function removeParenTags(str: string) {
	const parensRegex = /\s?\([^)]*?\)\s?$/
	while (str.match(parensRegex)) {
		str = str.replace(parensRegex, '')
	}
	return str
}

export function trimItemLabel(label: string) {
	// remove extraneous whitespace and title-case the bonapp titles
	const evenedWhitespace = label.replace(/\s+/g, ' ')
	const noParens = removeParenTags(evenedWhitespace)
	return toLaxTitleCase(noParens)
}
