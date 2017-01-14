// @flow
import React from 'react'
import {
  StyleSheet,
  Image,
  ListView,
  Platform,
  RefreshControl,
} from 'react-native'
import {fastGetTrimmedText} from '../../lib/html'
import delay from 'delay'
import {parseXml} from './parse-feed'
import type {StoryType} from './types'
import LoadingView from '../components/loading'
import {Row, Column} from '../components/layout'
import {ListRow, ListSeparator, Detail, Title} from '../components/list'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {tracker} from '../../analytics'
import {AllHtmlEntities} from 'html-entities'

const entities = new AllHtmlEntities()

type NewsRowPropsType = {
  story: StoryType,
  onPress: (t: string, s: StoryType) => any,
};
class NewsRow extends React.Component {
  state = {
    thumbnailUrl: null,
  }

  componentWillMount() {
    this.makeThumbnail(this.props)
  }

  componentWillReceiveProps(nextProps: NewsRowPropsType) {
    this.makeThumbnail(nextProps)
  }

  props: NewsRowPropsType;

  makeThumbnail = async (props: NewsRowPropsType) => {
    const thumbnailUrl = await new Promise(resolve => {
      // grab the URL
      const url = this.findImage(props.story['content:encoded'][0])
      // if we didn't find a valid URL, return null
      if (!url) {
        resolve(null)
      }

      // Image.getSize is a callback-based API
      Image.getSize(url,
        (width, height) => {
          // so if it's successful, we "resolve" the promise
          // – aka we return a value
          if (width >= 50 && height >= 50) {
            // if the image is big enough, we return the url
            resolve(url)
          }
          // otherwise, we return `null`
          resolve(null)
        },
        // if getSize fails, we also resolve with `null`
        () => resolve(null))
    })

    if (!thumbnailUrl) {
      return
    }

    this.setState({thumbnailUrl})
  }

  findImage = (content: string) => {
    let reUrl = /^https?:\/\/[^\s/$.?#].[^\s]*$/
    let reImg = /<img.*src=["'](.*?)["'].*?>/
    let imageMatch = reImg.exec(content)

    if (!imageMatch) {
      return null
    }

    let imageUrl = imageMatch[1]
    if (!reUrl.test(imageUrl)) {
      return null
    }

    return imageUrl
  }

  render() {
    let title = entities.decode(this.props.story.title[0])
    let snippet = entities.decode(fastGetTrimmedText(this.props.story.description[0]))
    let image = this.state.thumbnailUrl
      ? <Image source={{uri: this.state.thumbnailUrl}} style={styles.image} />
      : null

    return (
      <ListRow
        onPress={() => this.props.onPress(title, this.props.story)}
        arrowPosition='top'
      >
        <Row justifyContent='space-between'>
          <Column>
            <Title lines={1}>{title}</Title>
            <Detail lines={2}>{snippet}</Detail>
          </Column>
          {image}
        </Row>
      </ListRow>
    )
  }
}

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
  image: {
    height: 50,
    width: 50,
    marginTop: 3,
    marginLeft: 6,
    marginRight: 6,
  },
})
