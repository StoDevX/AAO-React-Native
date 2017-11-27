// @flow
import * as React from 'react'
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

type Props = TopLevelViewPropsType & {
  name: string,
  onRefresh: () => any,
  entries: StoryType[],
  loading: boolean,
  embedFeaturedImage: ?boolean,
  thumbnail: number,
}

export class NewsList extends React.PureComponent<Props> {
  onPressNews = (story: StoryType) => {
    this.props.navigation.navigate('NewsItemView', {
      story,
      embedFeaturedImage: this.props.embedFeaturedImage,
    })
  }

  renderSeparator = () => <ListSeparator spacing={{left: 101}} />

  renderItem = ({item}: {item: StoryType}) => (
    <NewsRow
      onPress={this.onPressNews}
      story={item}
      thumbnail={this.props.thumbnail}
    />
  )

  keyExtractor = (item: StoryType) => item.title

  render() {
    // remove all entries with blank excerpts
    // remove all entries with a <form from the list
    const entries = this.props.entries
      .filter(entry => entry.excerpt.trim() !== '')
      .filter(entry => !entry.content.includes('<form'))

    return (
      <FlatList
        ItemSeparatorComponent={this.renderSeparator}
        ListEmptyComponent={<NoticeView text="No news." />}
        data={entries}
        keyExtractor={this.keyExtractor}
        onRefresh={this.props.onRefresh}
        refreshing={this.props.loading}
        renderItem={this.renderItem}
        style={styles.listContainer}
      />
    )
  }
}
