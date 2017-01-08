// @flow
import React, {PropTypes} from 'react'
import {
  StyleSheet,
  ListView,
  Platform,
  Navigator,
  RefreshControl,
} from 'react-native'
import {Column} from '../components/layout'
import {ListRow, ListSeparator, Detail, Title} from '../components/list'
import {NoticeView} from '../components/notice'
import delay from 'delay'

import type {StoryType} from './types'
import LoadingView from '../components/loading'

const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()

export default class NewsContainer extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    navigator: PropTypes.instanceOf(Navigator).isRequired,
    route: PropTypes.object.isRequired,
    url: PropTypes.string.isRequired,
  }

  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (r1: StoryType, r2: StoryType) => r1.title != r2.title,
    }),
    refreshing: false,
    loaded: false,
    error: false,
  }

  componentWillMount() {
    this.refresh()
  }

  fetchData = async () => {
    try {
      let response = await fetchJson(this.props.url)
      let entries = response.responseData.feed.entries
      this.setState({dataSource: this.state.dataSource.cloneWithRows(entries)})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
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
    let title = entities.decode(story.title)
    let snippet = entities.decode(story.contentSnippet)
    return (
      <ListRow
        onPress={() => this.onPressNews(title, story)}
        arrowPosition='top'
      >
        <Column>
          <Title lines={1}>{title}</Title>
          <Detail lines={2}>{snippet}</Detail>
        </Column>
      </ListRow>
    )
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
    paddingBottom: 50,
    backgroundColor: '#ffffff',
  },
})
