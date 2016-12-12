// @flow
import React from 'react'
import uniqBy from 'lodash/uniqBy'
import identity from 'lodash/identity'
import filter from 'lodash/filter'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import {toLaxTitleCase} from 'titlecase'
import values from 'lodash/values'
import type {MenuItemContainerType, MenuItemType, StationMenuType} from '../types'
import type {FilterSpecType} from '../filter/types'
import type {ProcessedMenuPropsType} from './fancy-menu-list'
import {FancyMenuListView} from './fancy-menu-list'
import {applyFilters} from '../filter/apply'

type FancyMenuPropsType = {
  applyFilters: (items: MenuItemType[], filters: FilterSpecType[]) => MenuItemType[],
  stationMenus: StationMenuType[],
  foodItems: MenuItemContainerType,
  stationsToCreate: string[],
  filters: FilterSpecType[],
};

export class FancyMenuWrapper extends React.Component {
  static defaultProps = {
    applyFilters: applyFilters,
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

  render() {
    let props = this.props

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
    allMenuItems = this.props.applyFilters(allMenuItems, props.filters)
    // console.log('allItems, after filter', allMenuItems)

    // clean up the titles
    allMenuItems = allMenuItems.map(food => ({...food, label: this.trimItemLabel(food.label)}))

    // apply a sort to the list of menu items
    allMenuItems = sortBy(allMenuItems, [item => item.station, item => item.id])

    let data: ProcessedMenuPropsType = groupBy(allMenuItems, item => item.station)

    return <FancyMenuListView data={data} />
  }
}
