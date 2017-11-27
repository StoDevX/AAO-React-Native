// @flow

import * as React from 'react'
import {StyleSheet, Image} from 'react-native'
import {Column, Row} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import type {StoryType} from './types'

type Props = {
  onPress: StoryType => any,
  story: StoryType,
  thumbnail: number,
}

export class NewsRow extends React.PureComponent<Props> {
  _onPress = () => this.props.onPress(this.props.story)

  render() {
    const {story, thumbnail} = this.props

    return (
      <ListRow arrowPosition="top" onPress={this._onPress}>
        <Row alignItems="center">
          {story.featuredImage ? (
            <Image source={{uri: story.featuredImage}} style={styles.image} />
          ) : (
            <Image source={thumbnail} style={styles.image} />
          )}
          <Column flex={1}>
            <Title lines={1}>{story.title}</Title>
            <Detail lines={2}>{story.excerpt}</Detail>
          </Column>
        </Row>
      </ListRow>
    )
  }
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 5,
    marginRight: 15,
    height: 70,
    width: 70,
  },
})
