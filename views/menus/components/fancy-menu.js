// @flow
import React from 'react'
import {View, Navigator} from 'react-native'
import {connect} from 'react-redux'
import {updateMenuFilters} from '../../../flux'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import type {MenuItemType, MasterCorIconMapType} from '../types'
import type {FilterSpecType} from '../../components/filter'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import {FilterMenuToolbar} from './filter-menu-toolbar'
import {MenuListView} from './menu'
import {applyFilters} from '../lib/apply-filters'
import {buildMenuFilters} from '../lib/build-menu-filters'
import {trimStationName, trimItemLabel} from '../lib/trim-names'

type FancyMenuPropsType = TopLevelViewPropsType & {
  applyFilters: (items: MenuItemType[], filters: FilterSpecType[]) => MenuItemType[],
  now: momentT,
  name: string,
  filters: FilterSpecType[],
  foodItems: MenuItemType[],
  menuLabel?: string,
  menuCorIcons: MasterCorIconMapType,
  onFiltersChange: (f: FilterSpecType[]) => any,
};

class FancyMenuView extends React.Component {
  static defaultProps = {
    applyFilters: applyFilters,
  }

  componentWillMount() {
    let {foodItems, menuCorIcons} = this.props
    let filters: FilterSpecType[] = buildMenuFilters({foodItems, corIcons: menuCorIcons})
    this.props.onFiltersChange(filters)
  }

  props: FancyMenuPropsType;

  openFilterView = () => {
    this.props.navigator.push({
      id: 'FilterView',
      index: this.props.route.index + 1,
      title: 'Filter',
      sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
      onDismiss: (route: any, navigator: any) => navigator.pop(),
      props: {
        pathToFilters: ['menus', this.props.name],
        onChange: filters => this.props.onFiltersChange(filters),
      },
    })
  }

  render() {
    let {foodItems, now, menuLabel, filters} = this.props

    // get all the food
    let allMenuItems = foodItems.map(item => ({
      ...item,  // we want to edit the item, not replace it
      station: trimStationName(item.station),  // station names are a mess
      label: trimItemLabel(item.label),  // clean up the titles
    }))

    // apply the selected filters, then sort the list of menu items, then
    // group them for the ListView
    let filtered = applyFilters(allMenuItems, filters)
    let sorted = sortBy(filtered, [item => item.station, item => item.id])
    let grouped = groupBy(sorted, item => item.station)

    return (
      <View style={{flex: 1}}>
        <FilterMenuToolbar
          date={now}
          title={menuLabel}
          filters={filters}
          onPress={this.openFilterView}
        />
        <MenuListView data={grouped} />
      </View>
    )
  }
}

function mapStateToProps(state, actualProps: FancyMenuPropsType) {
  return {
    filters: state.menus[actualProps.name] || [],
  }
}

function mapDispatchToProps(dispatch, actualProps: FancyMenuPropsType) {
  return {
    onFiltersChange: (filters: FilterSpecType[]) => dispatch(updateMenuFilters(actualProps.name, filters)),
  }
}

export const FancyMenu = connect(mapStateToProps, mapDispatchToProps)(FancyMenuView)
