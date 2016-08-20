import {PropTypes} from 'react'

export type TabDefinitionType = {id: string, title: string, icon: string, content: any};

export type TabbedViewPropsType = {
  style: Object|number,
  tabs: TabDefinitionType[],
  childProps?: Object,
};

export const TabbedViewPropTypes = {
  style: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  childProps: PropTypes.object,
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
    content: PropTypes.func.isRequired,
    props: PropTypes.object,
  })).isRequired,
}
