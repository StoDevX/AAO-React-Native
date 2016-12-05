// @flow
import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
  Text,
} from 'react-native'

import uniqBy from 'lodash/uniqBy'
import identity from 'lodash/identity'
import filter from 'lodash/filter'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import {toLaxTitleCase} from 'titlecase'
import FoodItem from './food-item'
import DietaryFilters from './dietary-filters'
import includes from 'lodash/includes'
import values from 'lodash/values'
import difference from 'lodash/difference'

import * as c from '../../components/colors'

import type {MenuItemContainerType, MenuItemType, StationMenuType} from '../types'
import type {FilterSpecType} from '../filter/types'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  row: {
    minHeight: 52,
    paddingRight: 10,
    paddingLeft: 20,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ebebeb',
    marginLeft: 20,
  },
  sectionHeader: {
    backgroundColor: c.iosListSectionHeader,
    paddingVertical: 5,
    paddingLeft: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ebebeb',
  },
  sectionHeaderText: {
    color: 'black',
    fontWeight: 'bold',
  },
})


type FancyMenuPropsType = {
  stationMenus: StationMenuType[],
  foodItems: MenuItemContainerType,
  stationsToCreate: string[],
  filters: FilterSpecType[],
};

export default class FancyMenu extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (row1, row2) => row1 !== row2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
    }),
  }

  componentWillMount() {
    this.load(this.props)
  }

  componentWillReceiveProps(newProps: FancyMenuPropsType) {
    this.load(newProps)
  }

  load(props: FancyMenuPropsType) {
    let dataBlob = this.processData(props)
    this.setState({
      dataSource: this.state.dataSource.cloneWithRowsAndSections(dataBlob),
    })
  }

  props: FancyMenuPropsType;

  trimItemLabel(label: string) {
    // remove extraneous whitespace and title-case the bonapp titles
    return toLaxTitleCase(label.replace(/\s+/g, ' '))
  }

  trimStationName(stationName: string) {
    return stationName.replace(/<strong>@(.*)<\/strong>/, '$1')
  }

  buildStationMenu(station: StationMenuType, foodItems: MenuItemContainerType): MenuItemType[] {
    return station.items
      // dereference the item ids from the master list
      .map(itemId => foodItems[itemId])
      // remove any items that couldn't be found
      .filter(identity)
  }

  flatten(accumulator: any[], current: any[]) {
    return accumulator.concat(current)
  }

  applyFilters(items: MenuItemType[], filters: FilterSpecType[]): MenuItemType[] {
    // console.log('applyFilters called')
    let onlySpecialsFilter = filters.find(({key}) => key === 'specials')
    let onlySpecials = onlySpecialsFilter ? onlySpecialsFilter.value : false

    let stationsFilter = filters.find(({key}) => key === 'stations')
    let onlyTheseStations = []
    if (stationsFilter && stationsFilter.type === 'list') {
      // given all of the stations, get just the list that we want
      // (becuase we have a list of all possibilities, and a list of the one the user _doesn't_ want to see)
      onlyTheseStations = difference(stationsFilter.options, stationsFilter.value)
    }

    let dietaryRestrictionsFilter = filters.find(({key}) => key === 'restrictions')
    let onlyTheseDietaryRestrictions = []
    if (dietaryRestrictionsFilter && dietaryRestrictionsFilter.type === 'list') {
      // given all of the dietary restrictions, get just the list that we want
      onlyTheseDietaryRestrictions = difference(dietaryRestrictionsFilter.options, dietaryRestrictionsFilter.value)
    }

    // console.log(onlySpecials, onlyTheseStations, onlyTheseDietaryRestrictions)
    // console.log(items)

    if (onlySpecials) {
      items = filter(items, item => item.special === 1)
    }
    // console.log(items)

    if (onlyTheseStations.length) {
      items = filter(items, item => includes(onlyTheseStations, item.station))
    }
    // console.log(items)

    if (onlyTheseDietaryRestrictions.length) {
      items = filter(items, item => {
        let theseRestrictions = values(item.cor_icon)
        // if the item has no restrictions, it can't have the one we're filtering by.
        // then we check that the number of different items between the two lists is 0.
        return theseRestrictions.length && difference(theseRestrictions, onlyTheseDietaryRestrictions).length === 0
      })
    }
    // console.log(items)

    return items
  }

  processData(props: FancyMenuPropsType) {
    // console.log('processData called', props)
    let groupedMenuItems = props.stationMenus
      .map(menu => this.buildStationMenu(menu, props.foodItems))
      .filter(menu => menu.length)
      .reduce(this.flatten, [])

    let otherMenuItems = props.stationsToCreate
      // filter the foodItems mapping to only the requested station
      .map(station => filter(props.foodItems, item => item.station === station))
      .reduce(this.flatten, [])

    if (!props.stationsToCreate.length) {
      otherMenuItems = values(props.foodItems)
    }

    // in case we need a wider variety of sources in the future,
    // prevent ourselves from returning duplicate items
    let allMenuItems = uniqBy([...groupedMenuItems, ...otherMenuItems], item => item.id)

    allMenuItems = allMenuItems.map(item => ({...item, station: this.trimStationName(item.station)}))

    // apply the selected filters
    // console.log('allItems, before filter', allMenuItems)
    allMenuItems = this.applyFilters(allMenuItems, props.filters)
    // console.log('allItems, after filter', allMenuItems)

    // clean up the titles
    allMenuItems = allMenuItems.map(food => ({...food, label: this.trimItemLabel(food.label)}))

    // apply a sort to the list of menu items
    allMenuItems = sortBy(allMenuItems, [item => item.station, item => item.id])

    return groupBy(allMenuItems, item => item.station)
  }

  renderSectionHeader(sectionData: any, sectionId: string) {
    return (
      <View style={styles.sectionHeader} key={sectionId}>
        <Text style={styles.sectionHeaderText}>{sectionId}</Text>{sectionData.note ? <Text style={{color: c.iosDisabledText}}>({sectionData.note})</Text> : null}
      </View>
    )
  }

  renderFoodItem(rowData: MenuItemType, sectionId: string, rowId: string) {
    return (
      <FoodItem
        key={`${sectionId}-${rowId}`}
        data={rowData}
        filters={DietaryFilters}
        style={styles.row}
      />
    )
  }

  render() {
    return (
      <ListView
        style={styles.container}
        removeClippedSubviews={false}
        automaticallyAdjustContentInsets={true}
        dataSource={this.state.dataSource}
        enableEmptySections={true}
        renderRow={this.renderFoodItem}
        renderSeparator={(sectionId, rowId) => <View key={`${sectionId}-${rowId}`} style={styles.separator} />}
        renderSectionHeader={this.renderSectionHeader}
      />
    )
  }
}
