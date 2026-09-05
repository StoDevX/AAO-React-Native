import {deburr, words} from 'lodash'

import type {LinkGroup, LinkValue} from './types'

const labelWords = (link: LinkValue): string[] => {
	return Array.from(new Set(words(deburr(link.label.toLowerCase()))))
}

/**
 * Narrow the A-Z link groups to the links whose label matches `query`, dropping
 * any group left with nothing in it.
 *
 * A link matches when any word of its label contains the query, so "cal" finds
 * "Academic Calendar" from the middle of the name. Both sides are stripped of
 * their accents first: plenty of these labels are Norwegian, and "Rølvaag" has
 * to be reachable from a keyboard that cannot type ø.
 */
export const filterLinkGroups = (groups: LinkGroup[], query: string): LinkGroup[] => {
	let needle = deburr(query.toLowerCase())

	let filtered: LinkGroup[] = []
	for (let {title, data} of groups) {
		let links = data.filter((link) => labelWords(link).some((word) => word.includes(needle)))
		if (links.length) {
			filtered.push({title, data: links})
		}
	}
	return filtered
}
