export type CurrencyStringType = string
export type HtmlStringType = string
export type ItemIdReferenceStringType = string
export type MilitaryTimeStringType = string // H:mm
export type NumericStringType = string

export interface MenuItemType {
	connector: string
	cor_icon: ItemCorIconMapType
	description: string
	id: NumericStringType
	label: string
	monotony: MonotonyContainer
	nutrition: NutritionContainer
	nutrition_details?: NutritionDetailContainer
	nutrition_link: string
	options: unknown[]
	price: CurrencyStringType
	rating: NumericStringType
	special: boolean
	station: HtmlStringType
	sub_station: string
	sub_station_id: NumericStringType
	sub_station_order: NumericStringType
	tier3: boolean
	zero_entree: NumericStringType
}

export interface MonotonyContainer {
	id: string
	name: string
	short_name?: null
	image: string
}

export interface NutritionContainer {
	kcal: NumericStringType
	well_being: string
	well_being_image: string
}

export interface NutritionDetailContainer {
	calories: NutritionDetailType
	servingSize: NutritionDetailType
	fatContent: NutritionDetailType
	saturatedFatContent: NutritionDetailType
	transFatContent: NutritionDetailType
	cholesterolContent: NutritionDetailType
	sodiumContent: NutritionDetailType
	carbohydrateContent: NutritionDetailType
	fiberContent: NutritionDetailType
	sugarContent: NutritionDetailType
	proteinContent: NutritionDetailType
}

export interface NutritionDetailType {
	label: string
	value: number
	unit: string
}

export interface StationMenuType {
	order_id: string // sort on order_id instead of sorting on id
	id: NumericStringType
	label: string
	price: CurrencyStringType
	note: string
	soup: boolean
	items: ItemIdReferenceStringType[]
}

export interface CorIconType {
	sort: string
	label: string
	description: string
	image: string
}

export type MenuItemContainerType = Record<
	ItemIdReferenceStringType,
	MenuItemType
>
export type ItemCorIconMapType = Record<NumericStringType, string> | unknown[]
export type MasterCorIconMapType = Record<NumericStringType, CorIconType>

export interface ProcessedMealType {
	starttime: MilitaryTimeStringType
	endtime: MilitaryTimeStringType
	label: string
	stations: StationMenuType[]
}

export type DayPartsCollectionType = DayPartMenuType[][]

export interface DayPartMenuType {
	starttime: MilitaryTimeStringType
	endtime: MilitaryTimeStringType
	id: NumericStringType
	label: string
	abbreviation: string
	stations: StationMenuType[]
}
