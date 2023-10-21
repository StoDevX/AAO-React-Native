import cssSelect from 'css-select'
import {AnyNode, Document} from 'domhandler'
import {textContent} from 'domutils'
import {parseDocument} from 'htmlparser2'

export {cssSelect, textContent}
export {decode, encode} from 'html-entities'

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
