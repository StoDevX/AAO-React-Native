// @flow
export type ToggleSpecType = {
  type: 'toggle',
  label: string,
  key: string,
  title?: string,
  caption?: string,
  value: boolean,
};

export type ListSpecType = {
  type: 'list',
  multiple: boolean,
  key: string,
  title?: string,
  caption?: string,
  options: string[],
  value: string[],
};

export type FilterSpecType = ToggleSpecType | ListSpecType;
