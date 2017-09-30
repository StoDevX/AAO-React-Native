// @flow

import React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '../../components/colors'
import {connect} from 'react-redux'
import {updateMenuFilters} from '../../../flux'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import type {
  MenuItemType,
  MasterCorIconMapType,
  ProcessedMealType,
  MenuItemContainerType,
  StationMenuType,
} from '../types'
import size from 'lodash/size'
import values from 'lodash/values'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import type {FilterType} from '../../components/filter'
import {applyFiltersToItem} from '../../components/filter'
import {NoticeView} from '../../components/notice'
import {FilterMenuToolbar as FilterToolbar} from './filter-menu-toolbar'
import {FoodItemRow} from './food-item-row'
import {chooseMeal} from '../lib/choose-meal'
import {buildFilters} from '../lib/build-filters'

type Props = TopLevelViewPropsType & {
  applyFilters: (filters: FilterType[], item: MenuItemType) => boolean,
  cafeMessage?: ?string,
  filters: FilterType[],
  foodItems: MenuItemContainerType,
  meals: ProcessedMealType[],
  menuCorIcons: MasterCorIconMapType,
  name: string,
  now: momentT,
  onFiltersChange: (f: FilterType[]) => any,
  onRefresh?: ?() => any,
  refreshing?: ?boolean,
}

const styles = StyleSheet.create({
  inner: {
    backgroundColor: c.white,
  },
  message: {
    paddingVertical: 16,
  },
})

class FancyMenu extends React.PureComponent<any, Props, void> {
  static leftSideSpacing = 28
  static separator = () => (
    <ListSeparator spacing={{left: FancyMenu.leftSideSpacing}} />
  )

  static defaultProps = {
    applyFilters: applyFiltersToItem,
  }

  componentWillMount() {
    this.updateFilters(this.props)
  }

  componentWillReceiveProps(nextProps: Props) {
    this.updateFilters(nextProps)
  }

  updateFilters = (props: Props) => {
    const {foodItems, menuCorIcons, filters, meals, now} = props

    // prevent ourselves from overwriting the filters from redux on mount
    if (filters.length) {
      return
    }

    const newFilters = buildFilters(values(foodItems), menuCorIcons, meals, now)
    props.onFiltersChange(newFilters)
  }

  areSpecialsFiltered = filters => Boolean(filters.find(this.isSpecialsFilter))
  isSpecialsFilter = f =>
    f.enabled && f.type === 'toggle' && f.spec.label === 'Only Show Specials'

  openFilterView = () => {
    this.props.navigation.navigate('FilterView', {
      title: `Filter ${this.props.name} Menu`,
      pathToFilters: ['menus', this.props.name],
      onChange: filters => this.props.onFiltersChange(filters),
    })
  }

  groupMenuData = (props: Props, stations: Array<StationMenuType>) => {
    const {applyFilters, filters, foodItems} = props

    const derefrenceMenuItems = menu =>
      menu.items
        // Dereference each menu item
        .map(id => foodItems[id])
        // Ensure that the referenced menu items exist,
        // and apply the selected filters to the items in the menu
        .filter(item => item && applyFilters(filters, item))

    const menusWithItems = stations
      // We're grouping the menu items in a [label, Array<items>] tuple.
      .map(menu => [menu.label, derefrenceMenuItems(menu)])
      // We only want to show stations with at least one item in them
      .filter(([_, items]) => items.length)
      // We need to map the tuples into objects for SectionList
      .map(([title, data]) => ({title, data}))

    return menusWithItems
  }

  renderSectionHeader = ({section: {title}}: any) => {
    const {filters, now, meals} = this.props
    const {stations} = chooseMeal(meals, filters, now)
    const menu = stations.find(m => m.label === title)

    return (
      <ListSectionHeader
        title={title}
        subtitle={menu ? menu.note : ''}
        spacing={{left: FancyMenu.leftSideSpacing}}
      />
    )
  }

  renderItem = ({item}: {item: MenuItemType}) => {
    const specialsFilterEnabled = this.areSpecialsFiltered(this.props.filters)
    return (
      <FoodItemRow
        data={item}
        corIcons={this.props.menuCorIcons}
        badgeSpecials={!specialsFilterEnabled}
        spacing={{left: FancyMenu.leftSideSpacing}}
      />
    )
  }

  keyExtractor = (item, index) => index.toString()

  render() {
    const {filters, now, meals, cafeMessage} = this.props

    const {label: mealName, stations} = chooseMeal(meals, filters, now)
    const anyFiltersEnabled = filters.some(f => f.enabled)
    const specialsFilterEnabled = this.areSpecialsFiltered(filters)
    const groupedMenuData = this.groupMenuData(this.props, stations)

    let message = 'No items to show.'
    if (cafeMessage) {
      message = cafeMessage
    } else if (specialsFilterEnabled && stations.length === 0) {
      message =
        'No items to show. There may be no specials today. Try changing the filters.'
    } else if (anyFiltersEnabled && !size(groupedMenuData)) {
      message = 'No items to show. Try changing the filters.'
    }

    const messageView = <NoticeView style={styles.message} text={message} />

    const header = (
      <FilterToolbar
        date={now}
        title={mealName}
        filters={filters}
        onPress={this.openFilterView}
      />
    )

    return (
      <SectionList
        ItemSeparatorComponent={FancyMenu.separator}
        ListEmptyComponent={messageView}
        ListHeaderComponent={header}
        data={filters}
        keyExtractor={this.keyExtractor}
        onRefresh={this.props.onRefresh}
        refreshing={this.props.refreshing}
        renderItem={this.renderItem}
        renderSectionHeader={this.renderSectionHeader}
        sections={(groupedMenuData: any)}
        style={styles.inner}
      />
    )
  }
}

const mapState = (state, actualProps: Props) => ({
  filters: state.menus[actualProps.name] || [],
})

const mapDispatch = (dispatch, actualProps: Props) => ({
  onFiltersChange: (filters: FilterType[]) =>
    dispatch(updateMenuFilters(actualProps.name, filters)),
})

export const ConnectedFancyMenu = connect(mapState, mapDispatch)(FancyMenu)
