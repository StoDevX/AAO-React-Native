// @flow

import React from 'react'
import {
  StyleSheet,
  Image,
  View,
  Text,
} from 'react-native'
import {Touchable} from '../components/touchable'
import {Column} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import type {StoryType} from './types'
import * as c from '../components/colors'


type NewsRowPropsType = {
  onPress: () => any,
  story: StoryType,
};

function NewsListRow({onPress, story}: NewsRowPropsType) {
  return (
    <ListRow
      onPress={onPress}
      arrowPosition='top'
    >
      <Column>
        <Title lines={1}>{story.title}</Title>
        <Detail lines={2}>{story.excerpt}</Detail>
      </Column>
    </ListRow>
  )
}

function NewsCard({onPress, story}: NewsRowPropsType) {
  return (
    <Touchable style={styles.listRow} onPress={onPress}>
      <Image source={{uri: story.featuredImage}} style={styles.imageStyle}>
        <View style={styles.textBackground}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {story.title}
          </Text>
        </View>
      </Image>
    </Touchable>
  )
}

export function NewsRow(props: NewsRowPropsType) {
  if (props.story.featuredImage) {
    return <NewsCard {...props} />
  }
  return <NewsListRow {...props} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 5,
    paddingRight: 5,
    backgroundColor: c.olevilleBackground,
  },
  imageStyle: {
    height: 200,
  },
  itemTitle: {
    alignSelf: 'center',
    fontSize: 14,
    color: c.olevilleGold,
  },
  textBackground: {
    marginTop: 175,
    backgroundColor: c.black,
  },
  theLatest: {
    color: c.theLatest,
    borderBottomWidth: 5,
    fontSize: 18,
  },
  listRow: {
    marginTop: 5,
  },
})
