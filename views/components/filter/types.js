// @flow
export type ToggleSpecType = {
  label: string,
  title?: string,
  caption?: string,
};

export type ListSpecType = {
  title?: string,
  caption?: string,
  options: string[],
  selected: string[],
  mode: 'AND'|'OR',
};

export type ToggleFilterFunctionType = {
  key: string,
};

export type ListFilterFunctionType = {
  key: string,
};

export type ToggleType = {
  type: 'toggle',
  key: string,
  enabled: boolean,
  spec: ToggleSpecType,
  apply: ToggleFilterFunctionType,
};

export type ListType = {
  type: 'list',
  key: string,
  enabled: boolean,
  spec: ListSpecType,
  apply: ListFilterFunctionType,
};

export type FilterType = ToggleType | ListType;
