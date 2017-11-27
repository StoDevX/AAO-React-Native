// @flow
import * as React from 'react'
import {HtmlView} from '../components/html-view'
import {Share} from 'react-native'
import type {StoryType} from './types'
import {ShareButton} from '../components/nav-buttons'
import {css as newsStyles} from '../../../docs/news-styles.json'

const shareItem = (story: StoryType) => {
  if (!story.link) {
    return
  }
  Share.share({
    url: story.link,
  })
    .then(result => console.log(result))
    .catch(error => console.log(error.message))
}

export default function NewsItem(props: {
  navigation: {
    state: {
      params: {
        story: StoryType,
        embedFeaturedImage: ?boolean,
      },
    },
  },
}) {
  const {story, embedFeaturedImage} = props.navigation.state.params

  // Use local or remote styles
  let newsCSS =
    '<link rel="stylesheet" href="https://stodevx.github.io/AAO-React-Native/news-styles.css">'
  if (process.env.NODE_ENV === 'development') {
    newsCSS = `<style>${newsStyles}</style>`
  }

  const content = `
    ${newsCSS}
    <header class="aao-header">
      <h1>${story.title}</h1>
    </header>
    ${
      embedFeaturedImage && story.featuredImage
        ? `<img src="${story.featuredImage}">`
        : ''
    }
    ${story.content}
  `

  return <HtmlView baseUrl={story.link} html={content} />
}
NewsItem.navigationOptions = ({navigation}) => {
  const {story} = navigation.state.params
  return {
    title: story.title,
    headerRight: <ShareButton onPress={() => shareItem(story)} />,
  }
}
