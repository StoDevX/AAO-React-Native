// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {StyleSheet} from 'react-native'
import {BuildingRow} from './row'
import SimpleListView from '../components/listview'
import {tracker} from '../../analytics'

import type momentT from 'moment'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'

import * as c from '../components/colors'
import {ListSeparator, ListSectionHeader} from '../components/list'

export {BuildingHoursDetailView} from './detail'

const styles = StyleSheet.create({
  container: {
    backgroundColor: c.white,
  },
})

type BuildingHoursPropsType = TopLevelViewPropsType & {
  now: momentT,
  loading: boolean,
  onRefresh: () => any,
  buildings: {[key: string]: BuildingType[]},
}

export class BuildingHoursList extends React.Component {
  props: BuildingHoursPropsType

  onPressRow = (data: BuildingType) => {
    tracker.trackEvent('building-hours', data.name)
    this.props.navigation.navigate('BuildingHoursDetailView', {building: data})
  }

  renderSectionHeader = (data: any, id: string) => {
    return <ListSectionHeader title={id} />
  }

  renderSeparator = (sectionID: any, rowID: any) => {
    return <ListSeparator key={`${sectionID}-${rowID}`} />
  }

  render() {
    return (
      <SimpleListView
        data={this.props.buildings}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        contentContainerStyle={styles.container}
        removeClippedSubviews={false} // remove after https://github.com/facebook/react-native/issues/8607#issuecomment-241715202
        refreshing={this.props.loading}
        onRefresh={this.props.onRefresh}
      >
        {(data: BuildingType) =>
          <BuildingRow
            name={data.name}
            info={data}
            now={this.props.now}
            onPress={() => this.onPressRow(data)}
          />}
      </SimpleListView>
    )
  }
}
