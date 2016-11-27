// @flow

export type CurrencyStringType = string;
export type HtmlStringType = string;
export type ItemIdReferenceStringType = string;
export type MilitaryTimeStringType = string;
export type NumericStringType = string;

export type MenuItemType = {
  connector: string,
  cor_icon: ItemCorIconMapType,
  description: string,
  id: NumericStringType,
  label: string,
  nutrition: {
    kcal: NumericStringType,
    well_being: string,
    well_being_image: string,
  },
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
};

export type StationMenuType = {
  order_id: string, // sort on order_id instead of sorting on id
  id: NumericStringType,
  label: string,
  price: CurrencyStringType,
  note: string,
  soup: boolean,
  items: ItemIdReferenceStringType[],
};

export type DayPartMenuType = {
  starttime: MilitaryTimeStringType,
  endtime: MilitaryTimeStringType,
  id: NumericStringType,
  label: string,
  abbreviation: string,
  stations: StationMenuType[],
};

export type CafeMenuType = {
  name: string,
  menu_id: NumericStringType,
  dayparts: Array<Array<DayPartMenuType>>
};

export type MenuForDayType = {
  date: string,
  cafes: {[key: string]: CafeMenuType},
};

export type BonAppResponseType = {
  cor_icons: {[key: string]: Object},
  days: MenuForDayType[],
  items: MenuItemContainerType,
};

export type MenuItemContainerType = {[key: ItemIdReferenceStringType]: MenuItemType};
export type ItemCorIconMapType = {[key: NumericStringType]: string} | Array<void>;
export type MasterCorIconMapType = {[key: NumericStringType]: {label: string, icon: any}}
