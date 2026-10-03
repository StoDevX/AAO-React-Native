/**
 * Which card a carousel is showing, from the id its scroll position reports.
 * Before the first report, or for an id no card has, that is the first card.
 */
export function cardIndex(cards: ReadonlyArray<{id: string}>, shownId: string | null): number {
	let index = cards.findIndex((card) => card.id === shownId)
	return index === -1 ? 0 : index
}
