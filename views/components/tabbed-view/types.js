export type TabDefinitionType = {id: string, title: string, icon: string, content: any};

export type TabbedViewPropsType = {
  style: Object|number,
  tabs: TabDefinitionType[],
};
