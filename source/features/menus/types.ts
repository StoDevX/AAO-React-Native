import type {
	MenuItemType,
	StationMenuType,
	MenuItemContainerType,
	MasterCorIconMapType,
	ProcessedMealType,
	DayPartsCollectionType,
	DayPartMenuType,
	CorIconType,
} from '@frogpond/food-menu'

export type {
	MenuItemType,
	StationMenuType,
	MenuItemContainerType,
	MasterCorIconMapType,
	ProcessedMealType,
	DayPartsCollectionType,
	DayPartMenuType,
}

export type NumericStringType = string

export type CafeMenuType = {
	name: string
	menu_id: NumericStringType
	dayparts: DayPartsCollectionType
}

export type EditedMenuForDayType = {
	date: string
	cafe: CafeMenuType
}

export type EditedBonAppMenuInfoType = {
	cor_icons: {[key: string]: CorIconType}
	days: EditedMenuForDayType[]
	items: MenuItemContainerType
}

type BonAppSingleCafeInfo = {
	name: string
	address: string
	city: string
	state: string
	zip: string
	latitude: string
	longitude: string
	description: string
	message: string
	eod: string
	timezone: string
	menu_type: string
	menu_html: string
	weekly_schedule: string
	// Arrays rather than one-element tuples, which is what these were until a
	// closed Weitz arrived with `dayparts: []` -- a shape the tuple said could
	// not happen, so nothing checked for it.
	days: BonAppCafeDay[]
}

export type BonAppCafeDay = {
	date: string
	dayparts: {
		id: string
		starttime: string
		endtime: string
		message: string
		label: string
	}[]
	status: string
	/** `false`, rather than empty, when the cafe has nothing to say. */
	message: false | string
}

export type EditedBonAppCafeInfoType = {
	cafe: BonAppSingleCafeInfo
}

export type GithubMenuResponse = {
	foodItems: MenuItemType[]
	stationMenus: StationMenuType[]
	corIcons: MasterCorIconMapType
}

export type GithubMenuType = {
	foodItems: MenuItemContainerType
	corIcons: MasterCorIconMapType
	meals: ProcessedMealType[]
}
