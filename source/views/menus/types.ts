import type {
	CorIconType,
	DayPartMenuType,
	DayPartsCollectionType,
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from '@frogpond/food-menu'

export type {
	DayPartMenuType,
	DayPartsCollectionType,
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
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
	days: [
		{
			date: string
			dayparts: [
				{
					id: string
					starttime: string
					endtime: string
					message: string
					label: string
				},
			]
			status: 'open' | 'closed' | string
			message: false | string
		},
	]
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
