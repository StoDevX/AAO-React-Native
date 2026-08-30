// SPIKE: revert before merging. Points FoodMenu at the throwaway prototype so
// the Menus screens render it for profiling. The real implementation is still
// in ./fancy-menu.
export {SpikeMenu as FoodMenu} from './fancy-menu-spike'

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
