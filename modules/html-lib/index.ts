import {parseDOM} from 'htmlparser2'
import type {Element} from 'domhandler'
import cssSelect from 'css-select'
export {cssSelect}

import {AllHtmlEntities} from 'html-entities'

export const entities = new AllHtmlEntities()

export function parseHtml(string: string): Node[] {
	return parseDOM(string, {
		normalizeWhitespace: false,
		xmlMode: false,
		decodeEntities: true,
	})
}

// from https://github.com/fb55/domutils/blob/master/lib/stringify.js
export function getText(elem: Element | Element[]): string {
	if (Array.isArray(elem)) return elem.map(getText).join('')
	if (elem.type === 'tag') return getText(elem.children)
	if (elem.type === 'text') return elem.data
	return ''
}

function getTextWithSpaces(elem: Element | Element[]): string {
	if (Array.isArray(elem)) return elem.map(getTextWithSpaces).join(' ')
	if (elem.type === 'tag') return getTextWithSpaces(elem.children)
	if (elem.type === 'text') return elem.data
	return ''
}

export function getTrimmedTextWithSpaces(elem: Element | Element[]): string {
	return getTextWithSpaces(elem).split(/\s+/u).join(' ').trim()
}

export function removeHtmlWithRegex(str: string): string {
	return str.replace(/<[^>]*>/gu, ' ')
}

export function fastGetTrimmedText(str: string): string {
	return removeHtmlWithRegex(str).replace(/\s+/gu, ' ').trim()
}
