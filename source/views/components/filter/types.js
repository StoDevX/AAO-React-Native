// @flow

export type FilterFunctionType = {
  +key: string,
}

export type ToggleSpecType = {
  +label: string,
  +title?: string,
  +caption?: string,
}

export type ToggleType = {
  +type: 'toggle',
  +key: string,
  +enabled: boolean,
  +spec: ToggleSpecType,
  +apply: FilterFunctionType,
}

export type ListItemSpecType = {
  +title: string,
  +detail?: string,
  +image?: ?any,
}

export type ListSpecType = {
  +title?: string,
  +caption?: string,
  +showImages?: boolean,
  +options: ListItemSpecType[],
  +selected: ListItemSpecType[],
  +mode: 'AND' | 'OR',
}

export type ListType = {
  +type: 'list',
  +key: string,
  +enabled: boolean,
  +spec: ListSpecType,
  +apply: FilterFunctionType,
}

export type PickerItemSpecType = {
  +label: string,
}

export type PickerSpecType = {
  +title?: string,
  +caption?: string,
  +options: PickerItemSpecType[],
  +selected: ?PickerItemSpecType,
}

export type PickerType = {
  +type: 'picker',
  +key: string,
  +enabled: true,
  +spec: PickerSpecType,
  +apply: FilterFunctionType,
}

export type FilterType = ToggleType | ListType | PickerType
