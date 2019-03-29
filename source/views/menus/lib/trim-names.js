// @flow
import {toLaxTitleCase} from '@frogpond/titlecase'

export function trimStationName(stationName: string) {
	return stationName.replace(/<strong>@(.*)<\/strong>/u, '$1')
}

function removeParenTags(str: string) {
	const parensRegex = /\s?\([^)]*?\)\s?$/u
	while (str.match(parensRegex)) {
		str = str.replace(parensRegex, '')
	}
	return str
}

export function trimItemLabel(label: string) {
	// remove extraneous whitespace and title-case the bonapp titles
	const evenedWhitespace = label.replace(/\s+/gu, ' ')
	const noParens = removeParenTags(evenedWhitespace)
	return toLaxTitleCase(noParens)
}
