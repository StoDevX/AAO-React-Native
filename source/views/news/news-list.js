// @flow
import React from 'react'
import {
  StyleSheet,
  ListView,
  Platform,
  RefreshControl,
} from 'react-native'
import type {StoryType} from './types'
import {ListSeparator} from '../components/list'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {NewsRow} from './news-row'

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#ffffff',
  },
})

type NewsListPropsType = TopLevelViewPropsType & {
  name: string,
  onRefresh: () => any,
  entries: StoryType[],
  loading: boolean,
  embedFeaturedImage: ?boolean,
};

export class NewsList extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (r1: StoryType, r2: StoryType) => r1 != r2,
    }),
  }

  componentWillMount() {
    this.init(this.props)
  }

  componentWillReceiveProps(nextProps: NewsListPropsType) {
    this.init(nextProps)
  }

  props: NewsListPropsType;

  init(props: NewsListPropsType) {
    // remove all entries with a <form> from the list
    const entries = props.entries.filter(entry => !entry.content.includes('<form>'))
    this.setState({dataSource: this.state.dataSource.cloneWithRows(entries)})
  }

  renderRow = (story: StoryType) => {
    return (
      <NewsRow
        onPress={() => this.onPressNews(story.title, story)}
        story={story}
      />
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
      props: {story, embedFeaturedImage: this.props.embedFeaturedImage},
    })
  }

  render() {
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
