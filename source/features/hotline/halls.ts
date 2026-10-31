import type {MenuTab} from '../menus/campus-section'

/** A dining hall the hotline reads specials for, and how its Menus tab builds its menu. */
export type HotlineHall = {title: string; cafe: string; ignoreProvidedMenus: boolean}

/**
 * The Bon Appétit cafés among `tabs`, in their order. Other menus mark no
 * specials, so the hotline has nothing to read for them.
 */
export function hallsOf(tabs: ReadonlyArray<MenuTab>): HotlineHall[] {
	return tabs.flatMap((tab) =>
		tab.bonApp
			? [
					{
						title: tab.title,
						cafe: tab.bonApp.cafe,
						ignoreProvidedMenus: tab.bonApp.ignoreProvidedMenus ?? false,
					},
				]
			: [],
	)
}
