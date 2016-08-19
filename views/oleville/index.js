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

import NavigatorScreen from '../components/navigator-screen'
import LoadingView from '../components/loading'
import LatestView from './latestView'
import * as c from '../components/colors'

const URL = 'http://www.oleville.com/wp-json/wp/v2/posts?per_page=5'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageStyle: {

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

  async getImageUrl(id) {
    let response = await fetch(`http://oleville.com/wp-json/wp/v2/media/${id}`)
    let responseJson = await response.json()
    console.log('got image data')
    this.setState({loaded: true})
    return responseJson.media_details.sizes.medium.source_url
  }

  async fetchData() {
    let ds = new ListView.DataSource({
      rowHasChanged: this.rowHasChanged,
    })
    try {
      let response = await fetch(URL)
      let responseJson = await response.json()
      this.setState({dataSource: ds.cloneWithRows(responseJson)})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }
  }

  rowHasChanged(r1: StoryType, r2: StoryType) {
    return r1.title != r2.title
  }

  onPressLatestItem(title, content, imageURL) {
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

  renderRow(data) {
    let title = data.title.rendered
    let content = data.content.rendered
    let image = this.getImageUrl(data.featured_media)
    console.log(image)
    return (
      <TouchableOpacity onPress={() => this.onPressLatestItem(title, content, image)}>
        <Image source={{uri: image}} style={styles.imageStyle}>
          <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
        </Image>
      </TouchableOpacity>
    )
  }

  renderScene() {
    if (this.state.dataSource === null) {
      return <LoadingView />
    }
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderRow.bind(this)}
      />
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
