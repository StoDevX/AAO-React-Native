// @flow
import React from 'react'
import {
  StyleSheet,
  ListView,
  Platform,
  RefreshControl,
} from 'react-native'
import type {StoryType} from './types'
import LoadingView from '../components/loading'
import {Column} from '../components/layout'
import {ListRow, ListSeparator, Detail, Title} from '../components/list'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'

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
