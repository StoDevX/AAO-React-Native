// @flow
import React from 'react'
import {
  StyleSheet,
  ListView,
  Platform,
  RefreshControl,
} from 'react-native'
import delay from 'delay'
import {parseXml} from './parse-feed'
import type {StoryType} from './types'
import LoadingView from '../components/loading'
import {ListSeparator} from '../components/list'
import {NoticeView} from '../components/notice'
import {NewsRow} from './news-row'
import type {TopLevelViewPropsType} from '../types'
import {tracker} from '../../analytics'

export default class NewsContainer extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (r1: StoryType, r2: StoryType) => r1 != r2,
    }),
    refreshing: false,
    loaded: false,
    error: null,
  }

  componentWillMount() {
    this.refresh()
  }

  props: TopLevelViewPropsType & {
    name: string,
    url: string,
    mode: 'rss'|'wp-json',
  };

  fetchData = async () => {
    try {
      const responseText = await fetch(this.props.url).then(r => r.text())
      const feed = await parseXml(responseText)

      const entries = feed.rss.channel[0].item
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(entries),
      })
    } catch (error) {
      tracker.trackException(error.message)
      console.warn(error)
      this.setState({error})
    }

    this.setState({loaded: true})
  }

  refresh = async () => {
    let start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    this.setState(() => ({refreshing: false}))
  }

  renderRow = (story: StoryType) => {
    return <NewsRow story={story} onPress={this.onPressNews} />
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return <ListSeparator key={`${sectionId}-${rowId}`} />
  }

  onPressNews = (title: string, story: StoryType) => {
    this.props.navigator.push({
      id: 'NewsItemView',
      index: this.props.route.index + 1,
      title: title,
      backButtonTitle: this.props.name,
      props: {story},
    })
  }

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    if (!this.state.dataSource.getRowCount()) {
      return <NoticeView text='No news.' />
    }

    if (this.state.error) {
      return <NoticeView text={'Error: ' + this.state.error.message} />
    }

    return (
      <ListView
        style={styles.listContainer}
        contentInset={{bottom: Platform.OS === 'ios' ? 49 : 0}}
        dataSource={this.state.dataSource}
        renderRow={this.renderRow}
        renderSeparator={this.renderSeparator}
        pageSize={5}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this.refresh}
          />
        }
      />
    )
  }
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#ffffff',
  },
})
