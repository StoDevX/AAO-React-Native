// @flow
export type ToggleSpecType = {
  type: 'toggle',
  label: string,
  key: string,
  title?: string,
  caption?: string,
  value: boolean,
};

export type SelectSpecType = {
  type: 'list',
  multiple: boolean,
  key: string,
  booleanKind: 'AND' | 'OR' | 'NOR',
  title?: string,
  caption?: string,
  options: string[],
  value: string[],
};

export type FilterSpecType = ToggleSpecType | SelectSpecType;
