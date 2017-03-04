import {PropTypes, Navigator} from 'react'

export type TabDefinitionType = {
  id: string,
  title: string,
  rnVectorIcon: {iconName: string, selectedIconName?: string, iconSize?: number},
  rnRasterIcon?: {icon: {uri: string, scale: number}},
  component: () => any,
  props?: Object,
  navigator?: typeof Navigator,
  route?: Object,
};

export type TabbedViewPropsType = {
  style: Object|number,
  childProps?: Object,
  tabs: TabDefinitionType[],
};

export const TabbedViewPropTypes = {
  style: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  childProps: PropTypes.object,
  navigator: PropTypes.object,
  route: PropTypes.object,
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    rnVectorIcon: PropTypes.shape({
      iconName: PropTypes.string.isRequired,
      selectedIconName: PropTypes.string,
      iconSize: PropTypes.number,
    }),
    rnRasterIcon: PropTypes.shape({
      icon: PropTypes.shape({
        uri: PropTypes.string.isRequired,
        scale: PropTypes.number.isRequired,
      }),
    }),
    component: PropTypes.func.isRequired,
    props: PropTypes.object,
  })).isRequired,
}
