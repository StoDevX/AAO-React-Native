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

export interface CafeMenuType {
	name: string
	menu_id: NumericStringType
	dayparts: DayPartsCollectionType
}

export interface EditedMenuForDayType {
	date: string
	cafe: CafeMenuType
}

export interface EditedBonAppMenuInfoType {
	cor_icons: Record<string, CorIconType>
	days: EditedMenuForDayType[]
	items: MenuItemContainerType
}

interface BonAppSingleCafeInfo {
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

export interface EditedBonAppCafeInfoType {
	cafe: BonAppSingleCafeInfo
}

export interface GithubMenuResponse {
	foodItems: MenuItemType[]
	stationMenus: StationMenuType[]
	corIcons: MasterCorIconMapType
}

export interface GithubMenuType {
	foodItems: MenuItemContainerType
	corIcons: MasterCorIconMapType
	meals: ProcessedMealType[]
}
