import {innerTextWithSpaces, parseHtml} from '@frogpond/html-lib'
import type {StreamType} from './types'

/**
 * The quieter lines under a stream's title: where it is, and when it starts.
 *
 * An archived stream has already happened, so its start time says nothing
 * worth reading and is left out.
 *
 * The date is still a `Moment`, which is what the streams query builds. The
 * project prefers `date-fns` for new date handling, but moving this one off
 * Moment means changing that query's parsing too, which is its own change.
 */
export function streamDetailLines(stream: StreamType): string[] {
	let lines: string[] = []

	let where = decode(stream.subtitle || stream.performer || '')
	if (where) {
		lines.push(where)
	}

	if (stream.status !== 'archived') {
		lines.push(stream.date.format('h:mm A – ddd, MMM. Do, YYYY'))
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
