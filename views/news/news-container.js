// @flow
import React, {PropTypes} from 'react'
import {
  StyleSheet,
  View,
  ListView,
  Platform,
  Text,
  Navigator,
  TouchableHighlight,
  RefreshControl,
} from 'react-native'

import delay from 'delay'

import Icon from 'react-native-vector-icons/Ionicons'
import type {StoryType} from './types'
import LoadingView from '../components/loading'
import * as c from '../components/colors'

let Entities = require('html-entities').AllHtmlEntities
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
      let response = await fetch(this.props.url).then(r => r.json())
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
      <TouchableHighlight underlayColor={'#ebebeb'} onPress={() => this.onPressNews(title, story)}>
        <View style={[styles.row]}>
          <View style={[styles.rowContainer]}>
            <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.itemPreview} numberOfLines={2}>{snippet}</Text>
          </View>
          <Icon style={[styles.arrowIcon]} name='ios-arrow-forward' />
        </View>
      </TouchableHighlight>
    )
  }

  onPressNews = (title, story: StoryType) => {
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

    return (
      <ListView
        style={styles.listContainer}
        contentInset={{bottom: Platform.OS === 'ios' ? 49 : 0}}
        dataSource={this.state.dataSource}
        renderRow={this.renderRow}
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
    marginLeft: 20,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  arrowIcon: {
    color: c.iosText,
    fontSize: 20,
    marginRight: 6,
    marginLeft: 6,
    marginTop: 0,
  },
  rowContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  itemTitle: {
    color: c.black,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  itemPreview: {
    color: c.iosText,
    fontSize: 13,
    textAlign: 'left',
  },
})
