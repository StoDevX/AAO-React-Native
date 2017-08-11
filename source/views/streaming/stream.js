// @flow
/**
 * All About Olaf
 * Streaming Media page
 */

import React from 'react'
import {StyleSheet, View, Image, FlatList} from 'react-native'

import * as c from '../components/colors'
import LoadingView from '../components/loading'
import {NoticeView} from '../components/notice'
import {TabBarIcon} from '../components/tabbar-icon'
import moment from 'moment'
import {ListRow, ListSeparator, Detail, Title} from '../components/list'
import {Column, Row} from '../components/layout'
import {getTrimmedTextWithSpaces, parseHtml} from '../../lib/html'

let streamsAPI = 'https://www.stolaf.edu/multimedia/api/collection'

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
  },
  image: {
    marginLeft: 8,
    height: 40,
    width: 70,
  },
})

export default class StreamView extends React.PureComponent {
  static navigationOptions = {
    tabBarLabel: 'Streaming',
    tabBarIcon: TabBarIcon('videocam'),
  }

  state = {
    loaded: false,
    refreshing: true,
    error: null,
    noStreams: false,
    streams: [],
  }

  componentWillMount() {
    this.getData()
  }

  getData = async () => {
    try {
      const streams = await fetchJson(streamsAPI)
      const result = streams.results

      if (result.length < 1) {
        this.setState(() => ({noStreams: true}))
      }

      this.setState(() => ({
        streams: result,
        loaded: true,
        refreshing: false,
        error: null,
      }))
    } catch (error) {
      this.setState(() => ({error: error.message}))
      console.warn(error)
    }
  }

  renderItem = ({item}: {item: any}) =>
    <View /*onPress={this.onPressStream}*/>
      <ListRow
      //onPress={() => this.onPressEvent(stream)}
      arrowPosition='none'
      >
      <Row alignItems="center">
        <Column flex={1}>
          <Title lines={2}>{getTrimmedTextWithSpaces(parseHtml(item.title))}</Title>
          <Detail lines={1}>{getTrimmedTextWithSpaces(parseHtml(item.subtitle || item.performer))}</Detail>
          <Detail lines={1}>{moment(item.starttime, 'YYYY-MM-DD HH:mm').format('dddd, MMMM Do, YYYY, h:mma')}</Detail>
        </Column>
        {item.thumb
          ? <Image source={{uri: item.thumb}} style={styles.image} />
          : null}
      </Row>
    </ListRow>
  </View>

  keyExtractor = (item: any) => item.eid

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    if (this.state.error) {
      return <NoticeView text={'Error: ' + this.state.error.message} />
    }

    return (
      <FlatList
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<NoticeView text="No Streams" />}
        keyExtractor={this.keyExtractor}
        style={styles.listContainer}
        data={this.state.streams}
        refreshing={this.props.loading}
        onRefresh={this.props.onRefresh}
        renderItem={this.renderItem}
      />
    )
  }
}
