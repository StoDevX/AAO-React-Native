// @flow
import React, {PropTypes} from 'react'
import {
  StyleSheet,
  View,
  ListView,
  Text,
  Navigator,
  TouchableHighlight,
} from 'react-native'

import type {StoryType} from './types'
import LoadingView from '../components/loading'
import * as c from '../components/colors'

let Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()

export default class NewsContainer extends React.Component {
  static propTypes = {
    navigator: PropTypes.instanceOf(Navigator).isRequired,
    route: PropTypes.object.isRequired,
    url: PropTypes.string.isRequired,
  }

  state = {
    dataSource: null,
    loaded: false,
    error: false,
  }

  componentWillMount() {
    this.fetchData()
  }

  rowHasChanged(r1: StoryType, r2: StoryType) {
    return r1.title != r2.title
  }

  async fetchData() {
    let ds = new ListView.DataSource({
      rowHasChanged: this.rowHasChanged,
    })

    try {
      let response = await fetch(this.props.url)
      let responseJson = await response.json()
      this.setState({dataSource: ds.cloneWithRows(responseJson.responseData.feed.entries)})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }
    this.setState({loaded: true})
  }

  renderRow(story: StoryType) {
    let title = entities.decode(story.title)
    let snippet = entities.decode(story.contentSnippet)
    return (
      <TouchableHighlight underlayColor={'#ebebeb'} onPress={() => this.onPressNews(title, story)}>
        <View style={styles.rowContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.itemPreview} numberOfLines={2}>{snippet}</Text>
        </View>
      </TouchableHighlight>
    )
  }

  onPressNews(title, story: StoryType) {
    this.props.navigator.push({
      id: 'NewsItemView',
      index: this.props.route.index + 1,
      title: title,
      props: {story},
    })
  }

  render() {
    if (this.state.dataSource === null) {
      return <LoadingView />
    }

    return (
      <ListView
        style={styles.listContainer}
        dataSource={this.state.dataSource}
        renderRow={this.renderRow.bind(this)}
      />
    )
  }
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 50,
    backgroundColor: '#ffffff',
  },
  rowContainer: {
    marginLeft: 10,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  itemTitle: {
    color: c.black,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  itemPreview: {
    color: c.iosText,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 13,
    textAlign: 'left',
  },
})
