// @flow
import React from 'react'
import {
  StyleSheet,
  ListView,
  Platform,
  RefreshControl,
} from 'react-native'
import {fastGetTrimmedText} from '../../lib/html'
import qs from 'querystring'
import delay from 'delay'
import {parseXml} from './parse-feed'
import type {StoryType, FeedResponseType, RssFeedItemType, WpJsonItemType, WpJsonResponseType} from './types'
import LoadingView from '../components/loading'
import {Column} from '../components/layout'
import {ListRow, ListSeparator, Detail, Title} from '../components/list'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {tracker} from '../../analytics'
import {AllHtmlEntities} from 'html-entities'

const entities = new AllHtmlEntities()

class NewsList extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (r1: StoryType, r2: StoryType) => r1 != r2,
    }),
  }

  componentWillMount() {
    this.init(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.init(nextProps)
  }

  props: TopLevelViewPropsType & {
    name: string,
    onRefresh: () => any,
    entries: StoryType[],
    loading: boolean,
  };

  init(props) {
    this.setState({dataSource: this.state.dataSource.cloneWithRows(props.entries)})
  }

  renderRow = (story: StoryType) => {
    return (
      <ListRow
        onPress={() => this.onPressNews(story.title, story)}
        arrowPosition='top'
      >
        <Column>
          <Title lines={1}>{story.title}</Title>
          <Detail lines={2}>{story.excerpt}</Detail>
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
      props: story,
    })
  }

  render() {
    if (this.props.loading) {
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
        pageSize={6}
        refreshControl={
          <RefreshControl
            refreshing={this.props.loading}
            onRefresh={this.props.onRefresh}
          />
        }
      />
    )
  }
}

export default class NewsContainer extends React.Component {
  state: {
    entries: StoryType[],
    loading: boolean,
    refreshing: boolean,
    error: ?Error,
  } = {
    entries: [],
    loading: true,
    error: null,
    refreshing: false,
  }

  componentWillMount() {
    this.fetchData()
  }

  props: TopLevelViewPropsType & {
    name: string,
    url: string,
    query?: Object,
    mode: 'rss'|'wp-json',
  };

  fetchData = async () => {
    try {
      let entries: StoryType[] = []

      if (this.props.mode === 'rss') {
        entries = await this.fetchRssFeed(this.props.url, this.props.query)
      } else if (this.props.mode === 'wp-json') {
        entries = await this.fetchWpJson(this.props.url, this.props.query)
      } else {
        throw new Error(`unknown mode ${this.props.mode}`)
      }

      this.setState({entries})
    } catch (error) {
      tracker.trackException(error.message)
      console.warn(error)
      this.setState({error})
    }

    this.setState({loading: false})
  }

  fetchRssFeed: (url: string, query?: Object) => Promise<StoryType[]> = async (url, query) => {
    const responseText = await fetch(`${url}?${qs.stringify(query)}`).then(r => r.text())
    const feed: FeedResponseType = await parseXml(responseText)
    return feed.rss.channel[0].item.map(this.convertRssItemToStory)
  };

  fetchWpJson: (url: string, query?: Object) => Promise<StoryType[]> = async (url, query) => {
    const feed: WpJsonResponseType = await fetchJson(`${url}?${qs.stringify(query)}`)
    return feed.map(this.convertWpJsonItemToStory)
  };

  convertRssItemToStory(item: RssFeedItemType): StoryType {
    const authors = item['dc:creator'] || ['Unknown Author']
    const categories = item.category || []
    const link = (item.link || [])[0] || null
    const title = entities.decode(item.title[0] || '<no title>')
    const datePublished = (item.pubDate || [])[0] || null

    let content = (item['content:encoded'] || item.description || [])[0] || '<No content>'

    let excerpt = (item.description || [])[0] || content.substr(0, 250)
    excerpt = entities.decode(fastGetTrimmedText(excerpt))

    return {
      authors,
      categories,
      content,
      excerpt,
      link,
      title,
      datePublished,
    }
  }

  convertWpJsonItemToStory(item: WpJsonItemType): StoryType {
    let author = item.author
    if (item._embedded && item._embedded.author) {
      let authorInfo = item._embedded.author.find(a => a.id === item.author)
      author = authorInfo ? authorInfo.name : 'Unknown Author'
    } else {
      author = 'Unknown Author'
    }

    return {
      authors: [author],
      categories: [],
      content: item.content.rendered,
      excerpt: entities.decode(fastGetTrimmedText(item.excerpt.rendered)),
      link: item.link,
      title: entities.decode(item.title.rendered),
      datePublished: item.date_gmt,
    }
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

  render() {
    if (this.state.error) {
      return <NoticeView text={`Error: ${this.state.error.message}`} />
    }

    if (this.state.loading) {
      return <LoadingView />
    }

    return (
      <NewsList
        entries={this.state.entries}
        onRefresh={this.refresh}
        loading={this.state.refreshing}
        navigator={this.props.navigator}
        route={this.props.route}
        name={this.props.name}
        mode={this.props.mode}
      />
    )
  }
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#ffffff',
  },
})
