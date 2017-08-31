// @flow
import React from 'react'
import {HtmlView} from '../components/html-view'
import {Share} from 'react-native'
import type {StoryType} from './types'
import {ShareButton} from '../components/nav-buttons'

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
  let newsCSS = ''
  if (process.env.NODE_ENV === 'development') {
    let css = require('../../../docs/news-styles.json')
    newsCSS = `<Style>${css}</Style>`
  } else {
    newsCSS =
      '<link rel="stylesheet" href="https://stodevx.github.io/aao-react-native/news-styles.css">'
  }

  const content = `
    ${newsCSS}
    <header class="aao-header">
      <h1>${story.title}</h1>
    </header>
    ${embedFeaturedImage && story.featuredImage
      ? `<img src="${story.featuredImage}">`
      : ''}
    ${story.content}
  `

  return <HtmlView html={content} baseUrl={story.link} />
}
NewsItem.navigationOptions = ({navigation}) => {
  const {story} = navigation.state.params
  return {
    title: story.title,
    headerRight: <ShareButton onPress={() => shareItem(story)} />,
  }
}
