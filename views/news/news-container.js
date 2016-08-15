import React, {PropTypes} from 'react'
import {
  StyleSheet,
  View,
  ListView,
  Text,
  Navigator,
  TouchableOpacity,
} from 'react-native'

import LoadingView from './loading'
import * as c from '../components/colors'

let Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()

import NewsItemView from './news-item'

export default class NewsContainer extends React.Component {
  static propTypes = {
    navigator: PropTypes.instanceOf(Navigator),
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

  rowHasChanged(r1, r2) {
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

  renderRow(story) {
    let title = entities.decode(story.title)
    let snippet = entities.decode(story.contentSnippet)
    return (
      <TouchableOpacity onPress={() => this.onPressNews(title, story)}>
        <View style={styles.pageContainer}>
          <View style={styles.rightContainer}>
            <Text style={styles.newsTitle}>{title}</Text>
            <Text style={styles.newsSummary}>{snippet}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  onPressNews(title, story) {
    this.props.navigator.push({
      title: 'NewsItemView',
      component: <NewsItemView
        story={story}
        navigator={this.props.navigator}
      />,
    })
  }

  render() {
    if (this.state.dataSource === null) {
      return <LoadingView />
    }

    return (
      <ListView
        style={styles.newsItemContainer}
        dataSource={this.state.dataSource}
        renderRow={this.renderRow.bind(this)}
      />
    )
  }
}

const styles = StyleSheet.create({
  pageContainer: {
    marginLeft: 10,
    marginRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  rightContainer: {
    flex: 1,
  },
  newsItemContainer: {
    paddingBottom: 50,
    backgroundColor: '#ffffff',
  },
  newsPic: {
    width: 90,
    height: 60,
    margin: 10,
    marginLeft: 0,
  },
  newsTitle: {
    color: c.black,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  newsSummary: {
    color: c.iosText,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 6,
    fontSize: 13,
    textAlign: 'left',
  },
})
