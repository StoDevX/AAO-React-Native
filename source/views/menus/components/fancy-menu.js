// @flow
import React from 'react'
import {View} from 'react-native'
import {connect} from 'react-redux'
import {updateMenuFilters} from '../../../flux'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import type {
  MenuItemType,
  MasterCorIconMapType,
  StationMenuType,
  MenuItemContainerType,
} from '../types'
import type {FilterType} from '../../components/filter'
import {applyFiltersToItem} from '../../components/filter'
import {fastGetTrimmedText} from '../../../lib/html'
import fromPairs from 'lodash/fromPairs'
import filter from 'lodash/filter'
import map from 'lodash/map'
import values from 'lodash/values'
import {FilterMenuToolbar} from './filter-menu-toolbar'
import {MenuListView} from './menu'

type FancyMenuPropsType = TopLevelViewPropsType & {
  applyFilters: (filters: FilterType[], item: MenuItemType) => boolean,
  now: momentT,
  name: string,
  filters: FilterType[],
  foodItems: MenuItemContainerType,
  menuLabel?: string,
  menuCorIcons: MasterCorIconMapType,
  stationMenus: StationMenuType[],
  onFiltersChange: (f: FilterType[]) => any,
};

class FancyMenuView extends React.Component {
  static defaultProps = {
    applyFilters: applyFiltersToItem,
  }

  componentWillMount() {
    let {foodItems, menuCorIcons, filters, stationMenus} = this.props

    // prevent ourselves from overwriting the filters from redux on mount
    if (filters.length) {
      return
    }

    let foodItemsArray = values(foodItems)
    let stations = stationMenus.map(m => m.label)
    filters = this.buildFilters({foodItems: foodItemsArray, stations, corIcons: menuCorIcons})
    this.props.onFiltersChange(filters)
  }

  buildFilters({foodItems, stations, corIcons}: {foodItems: MenuItemType[], stations: string[], corIcons: MasterCorIconMapType}): FilterType[] {
    // Format the items for the stations filter
    const allStations = map(stations, name => ({title: name}))

    // Grab the labels of the COR icons
    const allDietaryRestrictions = map(corIcons, cor => ({
      title: cor.label,
      image: cor.image ? {uri: cor.image} : null,
      detail: cor.description ? fastGetTrimmedText(cor.description) : '',
    }))

    // Check if there is at least one special in order to show the specials-only filter
    const stationNames = allStations.map(s => s.title)
    const shouldShowSpecials = filter(foodItems, item =>
      item.special && stationNames.includes(item.station)).length >= 1

    return [
      {
        type: 'toggle',
        key: 'specials',
        enabled: shouldShowSpecials,
        spec: {
          label: 'Only Show Specials',
          caption: 'Allows you to either see only the "specials" for today, or everything the location has to offer (e.g., condiments.)',
        },
        apply: {
          key: 'special',
        },
      },
      {
        type: 'list',
        key: 'stations',
        enabled: false,
        spec: {
          title: 'Stations',
          options: allStations,
          mode: 'OR',
          selected: allStations,
        },
        apply: {
          key: 'station',
        },
      },
      {
        type: 'list',
        key: 'dietary-restrictions',
        enabled: false,
        spec: {
          title: 'Dietary Restrictions',
          showImages: true,
          options: allDietaryRestrictions,
          mode: 'AND',
          selected: [],
        },
        apply: {
          key: 'cor_icon',
        },
      },
    ]
  }

  props: FancyMenuPropsType;

  openFilterView = () => {
    this.props.navigator.push({
      id: 'FilterView',
      index: this.props.route.index + 1,
      title: 'Filter',
      sceneConfig: 'fromBottom',
      onDismiss: (route: any, navigator: any) => navigator.pop(),
      props: {
        pathToFilters: ['menus', this.props.name],
        onChange: filters => this.props.onFiltersChange(filters),
      },
    })
  }

  render() {
    const {
      applyFilters,
      filters,
      foodItems,
      menuLabel,
      now,
      stationMenus,
    } = this.props

    const stationNotes = fromPairs(stationMenus.map(m => [m.label, m.note]))

    const filteredByMenu = stationMenus
      .map(menu => [
        // we're grouping the menu items in a [label, Array<items>] tuple.
        menu.label,
        // dereference each menu item
        menu.items.map(id => foodItems[id])
          // ensure that the referenced menu items exist
          // and apply the selected filters to the items in the menu
          .filter(item => item && applyFilters(filters, item)),
      ])
      // we only want to show stations with at least one item in them
      .filter(([_, items]) => items.length)

    // group the tuples into an object (because ListView wants {key: value} not [key, value])
    const grouped = fromPairs(filteredByMenu)


    const specialsFilterEnabled = Boolean(filters.find(f =>
      f.enabled && f.type === 'toggle' && f.spec.label === 'Only Show Specials'))

    let message = ''
    if (specialsFilterEnabled && stationMenus.length === 0) {
      message = 'No items to show. There may be no specials today. Try changing the filters.'
    }

    return (
      <View style={{flex: 1}}>
        <FilterMenuToolbar
          date={now}
          title={menuLabel}
          filters={filters}
          onPress={this.openFilterView}
        />
        <MenuListView
          data={grouped}
          stationNotes={stationNotes}
          message={message}
          corIcons={this.props.menuCorIcons}
          // We can't conditionally show the star – wierd things happen, like
          // the first two items having a star and none of the rest.
          //badgeSpecials={!specialsFilterEnabled}
          badgeSpecials
        />
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
    onFiltersChange: (filters: FilterType[]) => dispatch(updateMenuFilters(actualProps.name, filters)),
  }
}

export const FancyMenu = connect(mapStateToProps, mapDispatchToProps)(FancyMenuView)
