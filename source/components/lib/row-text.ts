/** One or more quieter lines under a row's title, as a caller may give them. */
export type RowDetail = string | (string | undefined | null)[]

/**
 * The detail lines actually worth drawing, in order.
 *
 * A caller builds these straight from optional fields, so absent and blank
 * entries are dropped here rather than filtered at every call site.
 */
export function detailLinesOf(detail: RowDetail | undefined): string[] {
	if (!detail) {
		return []
	}

	let lines = Array.isArray(detail) ? detail : [detail]
	return lines.filter((line): line is string => Boolean(line && line.trim()))
}

/**
 * What VoiceOver announces for a row: its title and every line under it, as
 * one phrase. A row is one element to a screen reader, so lines it cannot
 * reach on their own have to arrive with the title.
 */
export function rowLabel(title: string, detail: RowDetail | undefined): string {
	return [title, ...detailLinesOf(detail)].join(', ')
}
