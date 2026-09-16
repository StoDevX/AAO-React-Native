import {innerTextWithSpaces, parseHtml} from '@frogpond/html-lib'
import {formatDateTime} from '@frogpond/time-format'
import type {StreamType} from './types'

/**
 * The quieter lines under a stream's title: where it is, and when it starts.
 *
 * An archived stream has already happened, so its start time says nothing
 * worth reading and is left out.
 */
export function streamDetailLines(stream: StreamType, locale?: string): string[] {
	let lines: string[] = []

	let where = decode(stream.subtitle || stream.performer || '')
	if (where) {
		lines.push(where)
	}

	if (stream.status !== 'archived') {
		lines.push(formatDateTime(stream.date, locale))
	}

	return lines
}

/** These titles arrive as HTML, entities and all. */
function decode(html: string): string {
	return html ? innerTextWithSpaces(parseHtml(html)) : ''
}

/** A stream's title, decoded the same way its detail lines are. */
export function streamTitle(stream: StreamType): string {
	return decode(stream.title)
}
