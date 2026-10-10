import type {ViewType} from '../views'
import type {HomeGroup} from './groups'

/** A campus's Home screen. */
export type HomeSection = {
	/**
	 * The tiles, in the order both layouts draw them. A tile that opens a
	 * screen is also a quick action's destination.
	 */
	tiles: ReadonlyArray<ViewType>
	/** Titled groups drawn after `tiles`, each under its own heading. Not quick actions. */
	groups?: ReadonlyArray<HomeGroup>
}
