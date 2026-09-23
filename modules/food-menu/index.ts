import {memo} from 'react'
import {FancyMenu} from './fancy-menu'

/**
 * A cafe's menu. Memoised because every cafe tab stays mounted once visited and
 * its screen ticks each minute to keep the navigation bar current; the menu's
 * own props hold still across a tick, so the menu is not rebuilt with it.
 */
export const FoodMenu = memo(FancyMenu)
export type {MealHeaderState, MealMenuSelection} from './fancy-menu'
export type {MealHeaderMenu, MealHeaderOption} from './lib/meal-header'
export {isClosedLabel} from './lib/closed'

export type {
	MenuItemType,
	StationMenuType,
	CorIconType,
	MenuItemContainerType,
	ItemCorIconMapType,
	MasterCorIconMapType,
	ProcessedMealType,
	DayPartsCollectionType,
	DayPartMenuType,
} from './types'
