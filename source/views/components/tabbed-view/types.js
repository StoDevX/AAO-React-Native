export type TabDefinitionType = {
  id: string,
  title: string,
  icon: string,
  component: () => ReactComponent<*>,
};

export type TabbedViewPropsType = {
  style: Object | number,
  tabs: TabDefinitionType[],
};
