// @flow
import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
  Text,
  Platform,
} from 'react-native'

import startCase from 'lodash/startCase'
import uniqBy from 'lodash/uniqBy'
import identity from 'lodash/identity'
import filter from 'lodash/filter'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import {toLaxTitleCase} from 'titlecase'
import FoodItem from './foodItem'
import DietaryFilters from './dietaryFilters'

import * as c from '../components/colors'

import type {MenuItemContainerType, MenuItemType, StationMenuType} from './types'

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

  componentDidReceiveProps(newProps: FancyMenuPropsType) {
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
      // the non-special foods are, like, salad dressings
      .filter(food => food.special)
  }

  flatten(accumulator: any[], current: any[]) {
    return accumulator.concat(current)
  }

  processData(props: FancyMenuPropsType) {
    let groupedMenuItems = props.stationMenus
      .map(menu => this.buildStationMenu(menu, props.foodItems))
      .filter(menu => menu.length)
      .reduce(this.flatten, [])

    let otherMenuItems = props.stationsToCreate
      // filter the foodItems mapping to only the requested station
      .map(station => [...filter(props.foodItems, item => item.station === station)])
      .reduce(this.flatten, [])

    // in case we need a wider variety of sources in the future
    // prevent ourselves from returning duplicate items
    let allMenuItems = uniqBy([...groupedMenuItems, ...otherMenuItems], item => item.id)

    // clean up the titles
    allMenuItems = allMenuItems.map(food => {
      return {...food, label: this.trimItemLabel(food.label)}
    })

    allMenuItems = sortBy(allMenuItems, [item => item.station, item => item.id])

    return groupBy(allMenuItems, item => startCase(this.trimStationName(item.station)))
  }

  renderSectionHeader(sectionData: any, sectionId: string) {
    return (
      <View style={styles.sectionHeader} key={sectionId}>
        <Text style={styles.sectionHeaderText}>{sectionId}</Text>
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
        contentInset={{bottom: Platform.OS === 'ios' ? 49 : 0}}
        dataSource={this.state.dataSource}
        enableEmptySections={true}
        renderRow={this.renderFoodItem}
        renderSeparator={(sectionId, rowId) => <View key={`${sectionId}-${rowId}`} style={styles.separator} />}
        renderSectionHeader={this.renderSectionHeader}
      />
    )
  }
}
