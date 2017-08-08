// @flow

import React from 'react'
import {StyleSheet, Image} from 'react-native'
import {Column, Row} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import type {StoryType} from './types'

export class NewsRow extends React.PureComponent {
  props: {
    onPress: StoryType => any,
    story: StoryType,
  }

  _onPress = () => this.props.onPress(this.props.story)

  render() {
    const {story} = this.props

    return (
      <ListRow onPress={this._onPress} arrowPosition="top">
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
}

const styles = StyleSheet.create({
  image: {
    marginLeft: 8,
    height: 50,
    width: 50,
  },
})
