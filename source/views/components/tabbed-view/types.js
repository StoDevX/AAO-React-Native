import {Navigator} from 'react-native'

export type TabDefinitionType = {
  id: string,
  title: string,
  rnVectorIcon: {
    iconName: string,
    selectedIconName?: string,
    iconSize?: number,
  },
  rnRasterIcon?: {icon: {uri: string, scale: number}},
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
