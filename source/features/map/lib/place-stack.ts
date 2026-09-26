import type {BuildingType} from '../../building-hours/types'
import type {StackEntry} from './also-here'

export type {StackEntry} from './also-here'

export type PlaceStackAction =
	/// A tile was tapped: its place stacks on top.
	| {type: 'push'; entry: StackEntry}
	/// The sheet at `depth` (its index in the stack) closed.
	| {type: 'pop'; depth: number}
	/// A place was chosen from search or tapped on the map.
	| {type: 'start'; id: string}
	/// The first card closed.
	| {type: 'clear'}

/**
 * The places open on the map, bottom to top: the first is the map sheet's
 * card, each above it a sheet stacked over the one before.
 *
 * A pop names the sheet that closed rather than just "the top", because a
 * sheet closed by its button also reports that it is no longer presented,
 * and the second report must not close the sheet beneath it as well.
 */
export function placeStack(stack: Array<StackEntry>, action: PlaceStackAction): Array<StackEntry> {
	switch (action.type) {
		case 'push':
			return [...stack, action.entry]
		case 'pop':
			return action.depth < stack.length ? stack.slice(0, action.depth) : stack
		case 'start':
			return [{kind: 'feature', id: action.id}]
		case 'clear':
			return []
		default: {
			let _exhaustive: never = action
			throw new Error(`Unhandled place stack action: ${JSON.stringify(_exhaustive)}`)
		}
	}
}

/**
 * The feature the map highlights: the top place's own, or for a venue the
 * feature it is keyed to. A venue that can't be placed on the map defers to
 * the place beneath it.
 */
export function highlightedFeatureId(
	stack: Array<StackEntry>,
	venues: Array<BuildingType>,
): string | null {
	for (let entry of [...stack].reverse()) {
		if (entry.kind === 'feature') {
			return entry.id
		}
		let building = venues.find((venue) => venue.name === entry.name)?.building
		if (building) {
			return building
		}
	}
	return null
}
