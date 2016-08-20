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
} from 'react-native'

import type {LatestViewPropsType} from './types'
import NavigatorScreen from '../components/navigator-screen'
import LoadingView from '../components/loading'
import LatestView from './latestView'
import * as c from '../components/colors'

const URL = 'http://oleville.com/wp-json/wp/v2/posts?per_page=5'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
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
    backgroundColor: c.iosText,
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
    title: PropTypes.string,
  }

  state = {
    dataSource: null,
    loaded: false,
    error: false,
  }

  componentWillMount() {
    this.fetchData()
  }

  async getImageUrl(id: number) {
    if (id) {
      let response = await fetch(`http://oleville.com/wp-json/wp/v2/media/${id}`)
      let responseJson = await response.json()
      this.setState({loaded: true})

      if (responseJson.media_details.sizes.medium.source_url) {
        // if there is a featured image, use that url
        return responseJson.media_details.sizes.medium.source_url
      } else {
        // otherwise default to the oleville logo
        return 'http://oleville.com/wp-content/uploads/2015/12/Oleville-Logo.png'
      }
    }
  }

  async fetchData() {
    let ds = new ListView.DataSource({
      rowHasChanged: this.rowHasChanged,
    })
    try {
      let response = await fetch(URL)
      let articles = await response.json()

      // get all the image urls
      let imageUrls = await Promise.all(articles.map(article => this.getImageUrl(article.featured_media)))
      // and embed them in the article responses
      articles.forEach((article, i) => {
        article._featuredImageUrl = imageUrls[i]
      })

      // then we have the _featuredImageUrl key to just get the url
      this.setState({dataSource: ds.cloneWithRows(articles), loaded: true})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }
  }

  rowHasChanged(r1: Object, r2: Object) {
    return r1.title != r2.title
  }

  onPressLatestItem(title: string, content: string, imageURL: string) {
    this.props.navigator.push({
      id: 'LatestView',
      title: title,
      component: <LatestView
        title={title}
        content={content}
        imageURL={imageURL}
        navigator={this.props.navigator}
      />,
    })
  }

  renderRow(data: Object) {
    let title = data.title.rendered
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

  renderScene() {
    if (this.state.dataSource === null) {
      return <LoadingView />
    }
    return (
      <View style={styles.container}>
        <Text style={styles.theLatest}>THE LATEST</Text>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderRow.bind(this)}
        />
      </View>
    )
  }

  render() {
    return <NavigatorScreen
      title='Oleville'
      navigator={this.props.navigator}
      renderScene={this.renderScene.bind(this)}
    />
  }

}
