// @flow
import React from 'react'
import {StyleSheet} from 'react-native'
import SimpleListView from '../components/listview'
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
  props: NewsListPropsType;

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
    // remove all entries with a <form> from the list
    const entries = this.props.entries.filter(entry => !entry.content.includes('<form>'))

    if (!entries.length) {
      return <NoticeView text='No news.' />
    }

    return (
      <SimpleListView
        style={styles.listContainer}
        forceBottomInset={true}
        data={entries}
        renderSeparator={this.renderSeparator}
        refreshing={this.props.loading}
        onRefresh={this.props.onRefresh}
      >
        {(story: StoryType) =>
          <NewsRow
            onPress={() => this.onPressNews(story.title, story)}
            story={story}
          />}
      </SimpleListView>
    )
  }
}
