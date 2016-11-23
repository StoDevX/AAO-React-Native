// @flow
export type ToggleSpecType = {
  type: 'toggle',
  label: string,
  key: string,
  title: ?string,
  caption: ?string,
  value: boolean,
};

export type SelectSpecType = {
  type: 'list',
  multiple: boolean,
  key: string,
  booleanKind: 'AND' | 'OR',
  title: ?string,
  caption: ?string,
  options: string[],
  value: string,
};

export type FilterSpecType = ToggleSpecType | SelectSpecType;



// export type ToggleAppliedType = {
//   type: 'toggle',
//   key: string,
//   value: bool,
// };

// export type SelectAppliedType = {
//   type: 'list',
//   booleanKind: 'AND' | 'OR',
//   key: string,
//   values: string[],
// };

// export type FilterAppliedType = ToggleAppliedType | SelectAppliedType;
