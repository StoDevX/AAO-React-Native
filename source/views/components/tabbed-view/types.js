import {Navigator} from 'react-native'

export type TabDefinitionType = {
  id: string,
  title: string,
  icon: string,
  component: () => any,
  props?: Object,
  navigator?: typeof Navigator,
  route?: Object,
};

export type TabbedViewPropsType = {
  style: Object | number,
  childProps?: Object,
  tabs: TabDefinitionType[],
};
