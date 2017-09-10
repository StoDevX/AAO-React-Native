// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {SectionList} from 'react-native'
import {BuildingRow} from './row'
import {tracker} from '../../analytics'

import type momentT from 'moment'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'

import {ListSeparator, ListSectionHeader, ListFooter} from '../components/list'

export {BuildingHoursDetailView} from './detail'

export class BuildingHoursList extends React.PureComponent {
  props: TopLevelViewPropsType & {
    now: momentT,
    loading: boolean,
    onRefresh: () => any,
    buildings: Array<{title: string, data: BuildingType[]}>,
  }

  onPressRow = (data: BuildingType) => {
    tracker.trackEvent('building-hours', data.name)
    this.props.navigation.navigate('BuildingHoursDetailView', {building: data})
  }

  keyExtractor = (item: BuildingType) => item.name

  renderSectionHeader = ({section: {title}}: any) =>
    <ListSectionHeader title={title} />

  renderItem = ({item}: {item: BuildingType}) =>
    <BuildingRow
      name={item.name}
      info={item}
      now={this.props.now}
      onPress={this.onPressRow}
    />

  render() {
    return (
      <SectionList
        ItemSeparatorComponent={ListSeparator}
        ListFooterComponent={<ListFooter title={'Building hours subject to change without notice\n\nData collected by the humans of All About Olaf'} />}
        sections={(this.props.buildings: any)}
        keyExtractor={this.keyExtractor}
        renderSectionHeader={this.renderSectionHeader}
        renderItem={this.renderItem}
        refreshing={this.props.loading}
        onRefresh={this.props.onRefresh}
      />
    )
  }
}
