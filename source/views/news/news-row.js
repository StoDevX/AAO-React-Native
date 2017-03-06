// @flow

import React from 'react'
import {StyleSheet, Image} from 'react-native'
import {Column, Row} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import type {StoryType} from './types'

type NewsRowPropsType = {
  onPress: () => any,
  story: StoryType,
};

export function NewsRow({onPress, story}: NewsRowPropsType) {
  return (
    <ListRow onPress={onPress} arrowPosition="top">
      <Row alignItems="center">
        <Column flex={1}>
          <Title lines={1}>{story.title}</Title>
          <Detail lines={2}>{story.excerpt}</Detail>
        </Column>
        {story.featuredImage
          ? <Image source={{uri: story.featuredImage}} style={styles.image} />
          : null}
      </Row>
    </ListRow>
  )
}

const styles = StyleSheet.create({
  listRow: {
    backgroundColor: 'transparent',
  },
  image: {
    marginLeft: 8,
    height: 50,
    width: 50,
  },
})
