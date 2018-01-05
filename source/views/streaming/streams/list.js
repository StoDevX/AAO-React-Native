// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'

import * as c from '../../components/colors'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import LoadingView from '../../components/loading'
import {NoticeView} from '../../components/notice'
import {TabBarIcon} from '../../components/tabbar-icon'
import {StreamRow} from './row'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import moment from 'moment-timezone'
import qs from 'querystring'
import {toLaxTitleCase as titleCase} from 'titlecase'
import type {StreamType} from './types'
import delay from 'delay'

const CENTRAL_TZ = 'America/Winnipeg'
const url = 'https://www.stolaf.edu/multimedia/api/collection'

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
  },
})

type Props = {}

type State = {
  error: ?string,
  loading: boolean,
  refreshing: boolean,
  streams: Array<{title: string, data: Array<StreamType>}>,
}

export class StreamListView extends React.PureComponent<Props, State> {
  static navigationOptions = {
    tabBarLabel: 'Streaming',
    tabBarIcon: TabBarIcon('recording'),
  }

  state = {
    error: null,
    loading: true,
    refreshing: false,
    streams: [],
  }

  componentWillMount() {
    this.getStreams().then(() => {
      this.setState(() => ({loading: false}))
    })
  }

  refresh = async (): any => {
    let start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.getStreams()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = Date.now() - start
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    this.setState(() => ({refreshing: false}))
  }

  getStreams = async (date: moment = moment.tz(CENTRAL_TZ)) => {
    try {
      const dateFrom = date.format('YYYY-MM-DD')
      const dateTo = date
        .clone()
        .add(1, 'month')
        .format('YYYY-MM-DD')

      let params = {
        class: 'current',
        sort: 'ascending',
        // eslint-disable-next-line camelcase
        date_from: dateFrom,
        // eslint-disable-next-line camelcase
        date_to: dateTo,
      }

      const streamsAPI = `${url}?${qs.stringify(params)}`
      const data = await fetchJson(streamsAPI)
      const streams = data.results

      // force title-case on the stream types, to prevent not-actually-duplicate headings
      const processed = streams
        .filter(stream => stream.category !== 'athletics')
        .map(stream => {
          const date = moment(stream.starttime, 'YYYY-MM-DD HH:mm')
          const group =
            stream.status.toLowerCase() != 'live'
              ? date.format('dddd, MMMM Do')
              : 'Live'

          return {
            ...stream,
            category: titleCase(stream.category),
            date: date,
            $groupBy: group,
          }
        })

      const grouped = groupBy(processed, j => j.$groupBy)
      const mapped = toPairs(grouped).map(([title, data]) => ({title, data}))

      this.setState(() => ({error: null, streams: mapped}))
    } catch (error) {
      this.setState(() => ({error: error.message}))
      console.warn(error)
    }
  }

  keyExtractor = (item: StreamType) => item.eid

  renderSectionHeader = ({section: {title}}: any) => (
    <ListSectionHeader title={title} />
  )

  renderItem = ({item}: {item: StreamType}) => <StreamRow stream={item} />

  render() {
    if (this.state.loading) {
      return <LoadingView />
    }

    if (this.state.error) {
      return <NoticeView text={'Error: ' + this.state.error} />
    }

    return (
      <SectionList
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<NoticeView text="No Streams" />}
        keyExtractor={this.keyExtractor}
        onRefresh={this.refresh}
        refreshing={this.state.refreshing}
        renderItem={this.renderItem}
        renderSectionHeader={this.renderSectionHeader}
        sections={(this.state.streams: any)}
        style={styles.listContainer}
      />
    )
  }
}
