// @flow

import React from 'react'
import {
  StyleSheet,
  Image,
  View,
} from 'react-native'
import {Touchable} from '../components/touchable'
import {Column} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import type {StoryType} from './types'


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
    <Touchable highlight={false} style={styles.card} onPress={onPress}>
      <View style={styles.wrapper}>
        <Image source={{uri: story.featuredImage}} style={styles.imageStyle} />
        <View style={styles.info}>
          <Title lines={1}>{story.title}</Title>
          <Detail lines={2}>{story.excerpt}</Detail>
        </View>
      </View>
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
  listRow: {
    backgroundColor: 'transparent',
  },
  imageStyle: {
    height: 180,
  },
  info: {
    marginVertical: 12,
    marginHorizontal: 10,
  },
  wrapper: {
    overflow: 'hidden',
    borderRadius: 2,
  },
  card: {
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 10,
    shadowColor: '#444',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 2,
    borderRadius: 2,
  },
})
