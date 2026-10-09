import type {ViewType} from '../views'

/** A campus's Home screen. */
export type HomeSection = {
	/**
	 * The tiles, in the order both layouts draw them. A tile that opens a
	 * screen is also a quick action's destination.
	 */
	tiles: ReadonlyArray<ViewType>
}
