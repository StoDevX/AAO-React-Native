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

export type DayPartMenuType = {|
	starttime: MilitaryTimeStringType,
	endtime: MilitaryTimeStringType,
	id: NumericStringType,
	label: string,
	abbreviation: string,
	stations: StationMenuType[],
|}

export type DayPartsCollectionType = Array<Array<DayPartMenuType>>

export type CafeMenuType = {
	name: string,
	menu_id: NumericStringType,
	dayparts: DayPartsCollectionType,
}

export type CarletonDetailMenuType = {
	component: any,
	id: string,
	props: {cafeId: string, loadingMessage: Array<string>},
	title: string,
}

export type MenuForDayType = {
	date: string,
	cafes: {[key: string]: CafeMenuType},
}

export type BonAppMenuInfoType = {
	cor_icons: {[key: string]: Object},
	days: MenuForDayType[],
	items: MenuItemContainerType,
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

export type BonAppCafeInfoType = {
	cafes: {
		[key: string]: {
			name: string,
			address: string,
			city: string,
			state: string,
			zip: string,
			latitude: string,
			longitude: string,
			description: string,
			message: string,
			eod: string,
			timezone: string,
			menu_type: string,
			menu_html: string,
			weekly_schedule: string,
			days: [
				{
					date: string,
					dayparts: [
						{
							id: string,
							starttime: string,
							endtime: string,
							message: string,
							label: string,
						},
					],
					status: 'open' | 'closed' | string,
					message: false | string,
				},
			],
		},
	},
}

export type ProcessedMealType = {|
	starttime: MilitaryTimeStringType,
	endtime: MilitaryTimeStringType,
	label: string,
	stations: StationMenuType[],
|}
