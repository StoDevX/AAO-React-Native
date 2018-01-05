// @flow

import * as React from 'react'
import {StyleSheet, Image, Alert} from 'react-native'
import {Column, Row} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import type {StoryType} from './types'

type Props = {
  onPress: string => any,
  story: StoryType,
  thumbnail: number,
}

export class NewsRow extends React.PureComponent<Props> {
  _onPress = () => {
    if (!this.props.story.link) {
      Alert.alert('There is nowhere to go for this story')
      return
    }
    this.props.onPress(this.props.story.link)
  }

  render() {
    const {story} = this.props
    const thumb = story.featuredImage
      ? {uri: story.featuredImage}
      : this.props.thumbnail

    return (
      <ListRow arrowPosition="top" onPress={this._onPress}>
        <Row alignItems="center">
          <Image source={thumb} style={styles.image} />
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
