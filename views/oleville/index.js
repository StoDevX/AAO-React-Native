// @flow
/**
 * All About Olaf
 * Oleville page
 */

import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    Navigator,
    TouchableOpacity,
    ListView,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import LoadingView from '../components/loading'
import LatestView from './latestView'
import OlevilleLatestPropsType from './types'
import * as c from '../components/colors'

const URL = 'http://www.oleville.com/wp-json/wp/v2/posts?per_page=3'

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
})

export default class OlevilleView extends React.Component {
  state = {
    dataSource: null,
    loaded: false,
    error: false,
  }

  componentWillMount() {
    this.fetchData()
  }

  async fetchData() {
    let ds = new ListView.DataSource({
      rowHasChanged: this.rowHasChanged,
    })
    try {
      let response = await fetch(URL)
      let responseJson = await response.json()
      this.setState({dataSource: ds.cloneWithRows(responseJson.responseData.feed.entries)})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }
    this.setState({loaded: true})
  }

  rowHasChanged(r1: StoryType, r2: StoryType) {
    return r1.title != r2.title
  }

  onPressLatestItem(title, content, imageURL) {
    this.props.navigator.push({
      id: 'LatestView',
      title: title,
      component: <LatestView
        navigator={this.props.navigator}
        title={title}
        content={content}
        imageURL={imageURL}
      />,
    })
  }

  renderRow(title, imageURL, content) {
    return (
      <TouchableOpacity underlayColor={'#ebebeb'} onPress={() => onPressLatestItem(title, content, imageURL)}>
        <View>
          <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  render() {
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
}
