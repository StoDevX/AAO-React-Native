// @flow

import React from 'react'
import {View, StyleSheet} from 'react-native'
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
} from '../types'
import fromPairs from 'lodash/fromPairs'
import size from 'lodash/size'
import values from 'lodash/values'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import type {FilterType} from '../../components/filter'
import {applyFiltersToItem} from '../../components/filter'
import SimpleListView from '../../components/listview'
import {NoticeView} from '../../components/notice'
import {FilterMenuToolbar} from './filter-menu-toolbar'
import {FoodItemRow} from './food-item-row'
import {chooseMeal} from '../lib/choose-meal'
import {buildFilters} from '../lib/build-filters'

type FancyMenuPropsType = TopLevelViewPropsType & {
  applyFilters: (filters: FilterType[], item: MenuItemType) => boolean,
  now: momentT,
  name: string,
  filters: FilterType[],
  foodItems: MenuItemContainerType,
  meals: ProcessedMealType[],
  menuCorIcons: MasterCorIconMapType,
  onFiltersChange: (f: FilterType[]) => any,
}

const leftSideSpacing = 28
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    backgroundColor: c.white,
  },
})

class FancyMenuView extends React.Component {
  static defaultProps = {
    applyFilters: applyFiltersToItem,
  }

  componentWillMount() {
    let {foodItems, menuCorIcons, filters, meals, now} = this.props

    // prevent ourselves from overwriting the filters from redux on mount
    if (filters.length) {
      return
    }

    const foodItemsArray = values(foodItems)
    this.props.onFiltersChange(
      buildFilters(foodItemsArray, menuCorIcons, meals, now),
    )
  }

  props: FancyMenuPropsType

  openFilterView = () => {
    this.props.navigation.navigate('FilterView', {
      pathToFilters: ['menus', this.props.name],
      onChange: filters => this.props.onFiltersChange(filters),
    })
  }

  renderSectionHeader = (sectionData: MenuItemType[], sectionName: string) => {
    const {filters, now, meals} = this.props
    const {stations} = chooseMeal(meals, filters, now)
    const menu = stations.find(m => m.label === sectionName)
    const note = menu ? menu.note : ''

    return (
      <ListSectionHeader
        title={sectionName}
        subtitle={note}
        spacing={{left: leftSideSpacing}}
      />
    )
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return (
      <ListSeparator
        spacing={{left: leftSideSpacing}}
        key={`${sectionId}-${rowId}`}
      />
    )
  }

  render() {
    const {applyFilters, filters, foodItems, now, meals} = this.props

    const {label: mealName, stations: stationMenus} = chooseMeal(
      meals,
      filters,
      now,
    )

    const filteredByMenu = stationMenus
      .map(menu => [
        // we're grouping the menu items in a [label, Array<items>] tuple.
        menu.label,
        // dereference each menu item
        menu.items
          .map(id => foodItems[id])
          // ensure that the referenced menu items exist
          // and apply the selected filters to the items in the menu
          .filter(item => item && applyFilters(filters, item)),
      ])
      // we only want to show stations with at least one item in them
      .filter(([_, items]) => items.length)

    // group the tuples into an object (because ListView wants {key: value} not [key, value])
    const grouped = fromPairs(filteredByMenu)

    const anyFiltersEnabled = filters.some(f => f.enabled)
    const specialsFilterEnabled = Boolean(
      filters.find(
        f =>
          f.enabled &&
          f.type === 'toggle' &&
          f.spec.label === 'Only Show Specials',
      ),
    )

    let messageView = null
    if (specialsFilterEnabled && stationMenus.length === 0) {
      messageView = (
        <NoticeView
          style={styles.inner}
          text="No items to show. There may be no specials today. Try changing the filters."
        />
      )
    } else if (anyFiltersEnabled && !size(grouped)) {
      messageView = (
        <NoticeView
          style={styles.inner}
          text="No items to show. Try changing the filters."
        />
      )
    } else if (!size(grouped)) {
      messageView = (
        <NoticeView style={styles.container} text="No items to show." />
      )
    }

    return (
      <View style={styles.container}>
        <FilterMenuToolbar
          date={now}
          title={mealName}
          filters={filters}
          onPress={this.openFilterView}
        />
        {messageView
          ? messageView
          : <SimpleListView
              style={styles.inner}
              data={grouped}
              renderSeparator={this.renderSeparator}
              renderSectionHeader={this.renderSectionHeader}
            >
              {(rowData: MenuItemType) =>
                <FoodItemRow
                  data={rowData}
                  corIcons={this.props.menuCorIcons}
                  // We can't conditionally show the star – wierd things happen, like
                  // the first two items having a star and none of the rest.
                  //badgeSpecials={!specialsFilterEnabled}
                  badgeSpecials={true}
                  spacing={{left: leftSideSpacing}}
                />}
            </SimpleListView>}
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
    onFiltersChange: (filters: FilterType[]) =>
      dispatch(updateMenuFilters(actualProps.name, filters)),
  }
}

export const FancyMenu = connect(mapStateToProps, mapDispatchToProps)(
  FancyMenuView,
)
