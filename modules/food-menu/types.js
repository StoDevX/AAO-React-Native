// @flow
export type CurrencyStringType = string
export type HtmlStringType = string
export type ItemIdReferenceStringType = string
export type MilitaryTimeStringType = string // H:mm
export type NumericStringType = string

export type MenuItemType = {
	connector: string,
	cor_icon: ItemCorIconMapType,
	description: string,
	id: NumericStringType,
	label: string,
	monotony:
		| {}
		| {
		id: string,
		name: string,
		short_name: ?null,
		image: string,
	},
	nutrition:
		| {}
		| {
		kcal: NumericStringType,
		well_being: string,
		well_being_image: string,
	},
	nutrition_link: string,
	options: any[],
	price: CurrencyStringType,
	rating: NumericStringType,
	special: boolean,
	station: HtmlStringType,
	sub_station: string,
	sub_station_id: NumericStringType,
	sub_station_order: NumericStringType,
	tier3: boolean,
	zero_entree: NumericStringType,
}

export type StationMenuType = {
	order_id: string, // sort on order_id instead of sorting on id
	id: NumericStringType,
	label: string,
	price: CurrencyStringType,
	note: string,
	soup: boolean,
	items: ItemIdReferenceStringType[],
}

export type CorIconType = {
	sort: string,
	label: string,
	description: string,
	image: string,
}

export type MenuItemContainerType = {
	[key: ItemIdReferenceStringType]: MenuItemType,
}
export type ItemCorIconMapType =
	| {[key: NumericStringType]: string}
	| Array<void>
export type MasterCorIconMapType = {[key: NumericStringType]: CorIconType}

export type ProcessedMealType = {|
	starttime: MilitaryTimeStringType,
	endtime: MilitaryTimeStringType,
	label: string,
	stations: StationMenuType[],
|}
