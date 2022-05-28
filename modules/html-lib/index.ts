import {parseDocument} from 'htmlparser2'
import {textContent} from 'domutils'
import {AnyNode, Document} from 'domhandler'
import cssSelect from 'css-select'

export {textContent, cssSelect}
export {encode, decode} from 'html-entities'

export function parseHtml(string: string): Document {
	return parseDocument(string, {
		xmlMode: false,
		decodeEntities: true,
	})
}

export function innerTextWithSpaces(elem: AnyNode): string {
	return textContent(elem).split(/\s+/u).join(' ').trim()
}

export function removeHtmlWithRegex(str: string): string {
	return str.replace(/<[^>]*>/gu, ' ')
}

export function fastGetTrimmedText(str: string): string {
	return removeHtmlWithRegex(str).replace(/\s+/gu, ' ').trim()
}
