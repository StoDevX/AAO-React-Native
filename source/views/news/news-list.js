// @flow
import React from 'react'
import {StyleSheet, FlatList} from 'react-native'
import * as c from '../components/colors'
import type {StoryType} from './types'
import {ListSeparator} from '../components/list'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {NewsRow} from './news-row'

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
  },
})

export class NewsList extends React.Component {
  props: TopLevelViewPropsType & {
    name: string,
    onRefresh: () => any,
    entries: StoryType[],
    loading: boolean,
    embedFeaturedImage: ?boolean,
  }

  onPressNews = (title: string, story: StoryType) => {
    this.props.navigation.navigate('NewsItemView', {
      story,
      embedFeaturedImage: this.props.embedFeaturedImage,
    })
  }

  renderItem = ({item}: {item: StoryType}) =>
    <NewsRow onPress={this.onPressNews} story={item} />

  keyExtractor = (item: StoryType) => item.title

  render() {
    // remove all entries with blank excerpts
    // remove all entries with a <form from the list
    const entries = this.props.entries
      .filter(entry => entry.excerpt.trim() !== '')
      .filter(entry => !entry.content.includes('<form'))

    return (
      <FlatList
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<NoticeView text="No news." />}
        keyExtractor={this.keyExtractor}
        style={styles.listContainer}
        data={entries}
        refreshing={this.props.loading}
        onRefresh={this.props.onRefresh}
        renderItem={this.renderItem}
      />
    )
  }
}
