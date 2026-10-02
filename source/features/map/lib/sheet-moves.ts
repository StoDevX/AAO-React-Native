/// The sheet's three stops, named for what they are rather than by height so
/// the rules read the way the design describes them.
export type SheetDetent = 'collapsed' | 'medium' | 'large'

export type SheetEvent =
	| {type: 'search-focused'}
	| {type: 'search-cancelled'}
	| {type: 'search-blurred'; hasText: boolean}
	| {type: 'row-tapped'}
	| {type: 'group-opened'}
	| {type: 'footprint-tapped'}
	| {type: 'dragged'; to: SheetDetent}

/// `previous` is the stop a search focus raised the sheet from, so cancelling
/// can put it back. Null when no return is pending.
export type SheetState = {current: SheetDetent; previous: SheetDetent | null}

/// Decides where the sheet goes after something happens to it.
///
/// The sheet moves only when its current stop cannot show the result of what
/// the user just did: a search needs the full list, a card needs more than the
/// collapsed strip, and a row tapped from the full list hides the map the row
/// is about. Everything else leaves the sheet where the user put it.
export function nextSheetDetent(event: SheetEvent, state: SheetState): SheetState {
	switch (event.type) {
		case 'search-focused':
			return {
				current: 'large',
				previous: state.current === 'large' ? state.previous : state.current,
			}
		case 'search-cancelled':
			// A drag after the focus means the user chose a stop themselves;
			// returning would override that choice.
			if (state.previous !== null && state.current === 'large') {
				return {current: state.previous, previous: null}
			}
			return {current: state.current, previous: null}
		case 'search-blurred':
			// A search that ends with text drops to medium so the pins it
			// framed are on screen, as Maps does; an empty field means the
			// search is over, and the sheet goes back where it came from.
			if (state.current !== 'large') {
				return state
			}
			if (event.hasText) {
				return {current: 'medium', previous: null}
			}
			if (state.previous !== null) {
				return {current: state.previous, previous: null}
			}
			return state
		// Both put something on the map -- a card's place, a group's pins --
		// that a full sheet would hide.
		case 'row-tapped':
		case 'group-opened':
			return {current: state.current === 'large' ? 'medium' : state.current, previous: null}
		case 'footprint-tapped':
			return {current: state.current === 'collapsed' ? 'medium' : state.current, previous: null}
		case 'dragged':
			return {current: event.to, previous: state.previous}
		default: {
			let _exhaustive: never = event
			throw new Error(`Unhandled sheet event: ${JSON.stringify(_exhaustive)}`)
		}
	}
}
