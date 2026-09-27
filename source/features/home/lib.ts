/** What a collapsed group says in place of its tiles. */
export function collapsedSummary(count: number): string {
	return count === 1 ? '1 tile' : `${count} tiles`
}
