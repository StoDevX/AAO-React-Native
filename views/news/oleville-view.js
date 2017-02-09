// @flow
/**
 * All About Olaf
 * Oleville page
 */

import React, {PropTypes} from 'react'
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ListView,
  Navigator,
  RefreshControl,
} from 'react-native'
import {tracker} from '../../analytics'
import delay from 'delay'
import LoadingView from '../components/loading'
import * as c from '../components/colors'
import { getTrimmedTextWithSpaces, parseHtml } from '../../lib/html'
import get from 'lodash/get'
import zipWith from 'lodash/zipWith'

const URL = 'http://oleville.com/wp-json/wp/v2/posts?per_page=5'
const defaultOlevilleImageUrl = 'http://oleville.com/wp-content/uploads/2015/12/Oleville-Logo.png'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 5,
    paddingRight: 5,
    backgroundColor: c.olevilleBackground,
  },
  imageStyle: {
    height: 200,
  },
  itemTitle: {
    alignSelf: 'center',
    fontSize: 14,
    color: c.olevilleGold,
  },
  textBackground: {
    marginTop: 175,
    backgroundColor: c.black,
  },
  theLatest: {
    color: c.theLatest,
    borderBottomWidth: 5,
    fontSize: 18,
  },
  listRow: {
    marginTop: 5,
  },
})

export default class OlevilleView extends React.Component {
  static propTypes = {
    navigator: PropTypes.instanceOf(Navigator).isRequired,
    route: PropTypes.object.isRequired,
  }

  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (r1: Object, r2: Object) => r1.title != r2.title,
    }),
    loaded: false,
    error: false,
    refreshing: false,
  }

  componentWillMount() {
    this.fetchData()
  }

  async getImageUrl(id: number) {
    try {
      if (id) {
        let responseJson = await fetchJson(`http://oleville.com/wp-json/wp/v2/media/${id}`)
        let url = get(responseJson, 'media_details.sizes.medium.source_url')
        return url || defaultOlevilleImageUrl
      }
    } catch (err) {
      tracker.trackException(err.message)
      console.warn(err)
    }
    return defaultOlevilleImageUrl
  }

  fetchData = async () => {
    try {
      let articles = await fetchJson(URL)

      // get all the image urls
      let imageUrls = await Promise.all(articles.map(article => this.getImageUrl(article.featured_media)))

      // and embed them in the article responses
      articles = zipWith(articles, imageUrls, (article, imageUrl) => {
        return {...article, _featuredImageUrl: imageUrl}
      })

      // then we have the _featuredImageUrl key to just get the url
      this.setState({dataSource: this.state.dataSource.cloneWithRows(articles)})
    } catch (error) {
      tracker.trackException(error.message)
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

  onPressLatestItem = (title: string, content: string, imageURL: string) => {
    this.props.navigator.push({
      id: 'OlevilleNewsStoryView',
      index: this.props.route.index + 1,
      title: title,
      props: {
        title: title,
        content: content,
        imageURL: imageURL,
      },
    })
  }

  renderRow = (data: Object) => {
    let title = getTrimmedTextWithSpaces(parseHtml(data.title.rendered))
    let content = data.content.rendered
    let image = data._featuredImageUrl
    //console.log(content)
    return (
      <TouchableOpacity style={styles.listRow} onPress={() => this.onPressLatestItem(title, content, image)}>
        <Image source={{uri: image}} style={styles.imageStyle}>
          <View style={styles.textBackground}>
            <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
          </View>
        </Image>
      </TouchableOpacity>
    )
  }

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }
    return (
      <View style={styles.container}>
        <Text style={styles.theLatest}>THE LATEST</Text>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderRow}
          pageSize={2}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.refresh}
            />
          }
        />
      </View>
    )
  }
}
