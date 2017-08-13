// @flow
/**
 * All About Olaf
 * Streaming Media page
 */

import React from 'react'
import {StyleSheet, SectionList} from 'react-native'

import * as c from '../../components/colors'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import LoadingView from '../../components/loading'
import {NoticeView} from '../../components/notice'
import {TabBarIcon} from '../../components/tabbar-icon'
import {StreamRow} from './row'
import type {StreamType} from './types'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import moment from 'moment-timezone'
import {toLaxTitleCase as titleCase} from 'titlecase'

const CENTRAL_TZ = 'America/Winnipeg'
const url =
  'https://www.stolaf.edu/multimedia/api/collection?class=upcoming&sort=ascending&date_from='

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
  },
})

export class StreamListView extends React.PureComponent {
  static navigationOptions = {
    tabBarLabel: 'Streaming',
    tabBarIcon: TabBarIcon('videocam'),
  }

  state: {
    error: ?Error,
    loaded: boolean,
    noStreams: boolean,
    refreshing: boolean,
    streams: Array<{title: string, data: Array<StreamType>}>,
  } = {
    error: null,
    loaded: false,
    noStreams: false,
    refreshing: true,
    streams: [],
  }

  componentWillMount() {
    this.getData()
  }

  getData = async () => {
    // try {
    // todo: change "archived" to "upcoming" because they're flipped in the API
    const date = moment.tz(CENTRAL_TZ).subtract(5, 'month').format('YYYY-MM-DD')
    const streamsAPI = `${url}${date}`

    const data = await fetchJson(streamsAPI)
    const streams = data.results

    // use querystream parameter here

    if (streams.length > 1) {
      this.setState(() => ({noStreams: true}))
    }

    // force title-case on the stream types, to prevent not-actually-duplicate headings
    const processed = streams
      .filter(stream => stream.category !== 'athletics')
      .map(stream => {
        const date = moment(stream.starttime, 'YYYY-MM-DD HH:mm')
        return {
          ...stream,
          category: titleCase(stream.category),
          date: date,
          $groupBy: date.format('dddd, MMMM Do'),
        }
      })

    const grouped = groupBy(processed, j => j.$groupBy)
    const mapped = toPairs(grouped).map(([title, data]) => ({title, data}))

    this.setState(() => ({
      error: null,
      loaded: true,
      refreshing: false,
      streams: mapped,
    }))
    // } catch (error) {
    //   this.setState(() => ({error: error.message}))
    //   console.warn(error)
    // }
  }

  keyExtractor = (item: StreamType) => item.eid

  renderSectionHeader = ({section: {title}}: any) =>
    <ListSectionHeader title={title} />

  renderItem = ({item}: {item: StreamType}) => <StreamRow stream={item} />

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    if (this.state.error) {
      return <NoticeView text={'Error: ' + this.state.error.message} />
    }

    return (
      <SectionList
        ListEmptyComponent={<NoticeView text="No Streams" />}
        renderSectionHeader={this.renderSectionHeader}
        sections={(this.state.streams: any)}
        ItemSeparatorComponent={ListSeparator}
        keyExtractor={this.keyExtractor}
        style={styles.listContainer}
        refreshing={this.props.loading}
        onRefresh={this.props.onRefresh}
        renderItem={this.renderItem}
      />
    )
  }
}
