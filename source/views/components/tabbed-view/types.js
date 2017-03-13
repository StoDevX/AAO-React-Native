// @flow

export type TabPropsType = {
  id: string,
  icon: string,
  title: string,
  render: () => ReactElement<*>,
};

export type TabbedViewPropsType = {
  style?: Object | number | Array<Object | number>,
  tabs: Array<?TabPropsType>,
};
