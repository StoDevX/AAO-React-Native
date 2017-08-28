// @flow

import React from 'react'
import {View, StyleSheet, SectionList} from 'react-native'
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
import size from 'lodash/size'
import values from 'lodash/values'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import type {FilterType} from '../../components/filter'
import {applyFiltersToItem} from '../../components/filter'
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

const CustomSeparator = () => (
  <ListSeparator spacing={{left: leftSideSpacing}} />
)

class FancyMenuView extends React.PureComponent {
  static defaultProps = {
    applyFilters: applyFiltersToItem,
  }

  props: FancyMenuPropsType

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

  openFilterView = () => {
    this.props.navigation.navigate('FilterView', {
      pathToFilters: ['menus', this.props.name],
      onChange: filters => this.props.onFiltersChange(filters),
    })
  }

  renderSectionHeader = ({section: {title}}: any) => {
    const {filters, now, meals} = this.props
    const {stations} = chooseMeal(meals, filters, now)
    const menu = stations.find(m => m.label === title)
    const note = menu ? menu.note : ''

    return (
      <ListSectionHeader
        title={title}
        subtitle={note}
        spacing={{left: leftSideSpacing}}
      />
    )
  }

  keyExtractor = (item, index) => index.toString()

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

    // map the tuples into objects for SectionList
    const grouped = filteredByMenu.map(([title, data]) => ({title, data}))

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
      messageView = <NoticeView style={styles.inner} text="No items to show." />
    }

    return (
      <View style={styles.container}>
        <FilterMenuToolbar
          date={now}
          title={mealName}
          filters={filters}
          onPress={this.openFilterView}
        />
        {messageView ? (
          messageView
        ) : (
          <SectionList
            ItemSeparatorComponent={CustomSeparator}
            ListEmptyComponent={messageView}
            keyExtractor={this.keyExtractor}
            style={styles.inner}
            sections={grouped}
            renderSectionHeader={this.renderSectionHeader}
            renderItem={({item}: {item: MenuItemType}) => (
              <FoodItemRow
                data={item}
                corIcons={this.props.menuCorIcons}
                badgeSpecials={!specialsFilterEnabled}
                spacing={{left: leftSideSpacing}}
              />
            )}
          />
        )}
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
