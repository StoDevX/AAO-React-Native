import {parseDocument} from 'htmlparser2'

import {textContent} from 'domutils'
export {textContent}

import type {Node, Document} from 'domhandler'

import cssSelect from 'css-select'
export {cssSelect}

export {encode, decode} from 'html-entities'

export function parseHtml(string: string): Document {
	return parseDocument(string, {
		normalizeWhitespace: false,
		xmlMode: false,
		decodeEntities: true,
	})
}

export function innerTextWithSpaces(elem: Node | Node[]): string {
	return textContent(elem).split(/\s+/u).join(' ').trim()
}

export function removeHtmlWithRegex(str: string): string {
	return str.replace(/<[^>]*>/gu, ' ')
}

export function fastGetTrimmedText(str: string): string {
	return removeHtmlWithRegex(str).replace(/\s+/gu, ' ').trim()
}
