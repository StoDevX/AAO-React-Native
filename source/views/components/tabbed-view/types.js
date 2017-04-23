// @flow

export type TabDefinitionType = {
  id: string,
  title: string,
  icon: string,
  component: () => ReactElement<*>,
}

export type TabbedViewPropsType = {
  style?: Object | number | Array<Object | number>,
  tabs: TabDefinitionType[],
}
