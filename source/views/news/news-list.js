// @flow
import React from 'react'
import {StyleSheet, Platform, Share} from 'react-native'
import * as c from '../components/colors'
import SimpleListView from '../components/listview'
import type {StoryType} from './types'
import {ListSeparator} from '../components/list'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {NewsRow} from './news-row'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '../components/touchable'

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
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
  };

  shareItem = (story: StoryType) => {
    Share.share({
      url: story.link,
      message: story.link,
    })
      .then(result => console.log(result))
      .catch(error => console.log(error.message))
  };

  onPressNews = (title: string, story: StoryType) => {
    this.props.navigator.push({
      id: 'NewsItemView',
      index: this.props.route.index + 1,
      title: title,
      backButtonTitle: this.props.name,
      props: {story, embedFeaturedImage: this.props.embedFeaturedImage},
      rightButton: ({contentContainerStyle, style}) => (
        <Touchable
          highlight={false}
          style={[contentContainerStyle]}
          onPress={() => this.shareItem(story)}
        >
          {Platform.OS === 'ios'
            ? <Icon style={[style]} name="ios-share-outline" />
            : <Icon style={[style]} name="md-share" />}
        </Touchable>
      ),
    })
  };

  render() {
    // remove all entries with blank excerpts
    // remove all entries with a <form from the list
    const entries = (this.props.entries.filter(
      entry => entry.excerpt.trim() !== '').filter(
        entry => !entry.content.includes('<form')
      )
    )

    if (!entries.length) {
      return <NoticeView text="No news." />
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
        {(story: StoryType) => (
          <NewsRow
            onPress={() => this.onPressNews(story.title, story)}
            story={story}
          />
        )}
      </SimpleListView>
    )
  }
}
