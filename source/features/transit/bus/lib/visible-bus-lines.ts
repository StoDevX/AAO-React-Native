import type {UnprocessedBusLine} from '../types'

/**
 * The lines the Transit screen draws a widget for: every line the feed
 * publishes, less the ones it has retired.
 *
 * Filtered here rather than in the query: `busLineOptions` shares the query's
 * cache key and selects a single line by name for the timetable sheet, so
 * hiding a line at fetch time would make that lookup fail to find it too.
 */
export function visibleBusLines(lines: UnprocessedBusLine[]): UnprocessedBusLine[] {
	return lines.filter((line) => !line.hidden)
}
