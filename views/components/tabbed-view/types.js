import {PropTypes} from 'react'

export type TabDefinitionType = {id: string, title: string, icon: string, content: any};

export type TabbedViewPropsType = {
  style: Object|number,
  tabs: TabDefinitionType[],
};

export const TabbedViewPropTypes = {
  style: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    content: PropTypes.func.isRequired,
    props: PropTypes.object,
  })).isRequired,
}
