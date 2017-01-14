// @flow
import React from 'react'
import {Image, StyleSheet} from 'react-native'
import {fastGetTrimmedText} from '../../lib/html'
import type {StoryType} from './types'
import {Row, Column} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import {AllHtmlEntities} from 'html-entities'

const entities = new AllHtmlEntities()

type NewsRowPropsType = {
  story: StoryType,
  onPress: (title: string, story: StoryType) => any,
};

export class NewsRow extends React.Component {
  state = {
    thumbnailUrl: null,
  }

  componentWillMount() {
    this.makeThumbnail(this.props)
  }

  componentWillReceiveProps(nextProps: NewsRowPropsType) {
    this.makeThumbnail(nextProps)
  }

  props: NewsRowPropsType;

  makeThumbnail = async (props: NewsRowPropsType) => {
    const thumbnailUrl = await new Promise(resolve => {
      // grab the URL
      const url = this.findImage(props.story['content:encoded'][0])
      // if we didn't find a valid URL, return null
      if (!url) {
        resolve(null)
        return
      }

      // Image.getSize is a callback-based API
      Image.getSize(url,
        (width, height) => {
          // so if it's successful, we "resolve" the promise
          // – aka we return a value
          if (width >= 50 && height >= 50) {
            // if the image is big enough, we return the url
            resolve(url)
          }
          // otherwise, we return `null`
          resolve(null)
        },
        // if getSize fails, we also resolve with `null`
        () => resolve(null))
    })

    if (!thumbnailUrl) {
      return
    }

    this.setState({thumbnailUrl})
  }

  findImage = (content: string) => {
    let reUrl = /^https?:\/\/[^\s/$.?#].[^\s]*$/
    let reImg = /<img.*src=["'](.*?)["'].*?>/
    let imageMatch = reImg.exec(content)

    if (!imageMatch) {
      return null
    }

    let imageUrl = imageMatch[1]
    if (!reUrl.test(imageUrl)) {
      return null
    }

    return imageUrl
  }

  render() {
    let title = entities.decode(this.props.story.title[0])
    let snippet = entities.decode(fastGetTrimmedText(this.props.story.description[0]))
    let image = this.state.thumbnailUrl
      ? <Image source={{uri: this.state.thumbnailUrl}} style={styles.image} />
      : null

    return (
      <ListRow
        onPress={() => this.props.onPress(title, this.props.story)}
        arrowPosition='top'
      >
        <Row justifyContent='space-between'>
          <Column>
            <Title lines={1}>{title}</Title>
            <Detail lines={2}>{snippet}</Detail>
          </Column>
          {image}
        </Row>
      </ListRow>
    )
  }
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#ffffff',
  },
})
