import type {SFSymbol} from 'sf-symbols-typescript'

import type {CampusId} from '../../campuses/ids'
import type {ViewType} from '../views'

/** A tab of Menus: a café, and the route file under `app/menus/` it opens. */
export type MenuTab = {
	/**
	 * The tab's route file under `app/menus/`. Unique across campuses: a
	 * café's screen finds its campus by its tab's name.
	 */
	name: string
	title: string
	icon: SFSymbol
	/**
	 * A Bon Appétit café drawn from this data by `TabCafeMenu`: its name with Bon
	 * Appétit, and what the menu says while it loads, one picked at random.
	 */
	bonApp?: {cafe: string; loadingMessage: string[]}
}

export type MenusSection = {
	/** The campus's cafés, in its tab bar's order. */
	tabs: readonly MenuTab[]
	/** Cafés with a Home Screen quick action each, though Home has one Menus tile for them all. */
	quickActions?: readonly ViewType[]
	/** The campus whose server answers for these cafés; the campus's own when absent. */
	server?: CampusId
}
