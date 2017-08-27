// @flow
import React from 'react'
import {HtmlView} from '../../components/html-view'
import {Share} from 'react-native'
import type {StoryType} from './types'
import {ShareButton} from '../../components/nav-buttons'

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

  const content = `
    <style>
      body {
        font-family: -apple-system, Roboto, sans-serif;
        font-size: 16px;
        margin: 0;
        padding: 1em;
      }
      div {
        width: auto !important;
      }
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 12px auto;
      }
      p {
        line-height: 1.2em;
        margin-bottom: 0.25em;
      }
      iframe {
        max-width: 100%;
      }
      .aao-header {
        border-bottom: solid 2px #eaeaea;
        margin: 0 0 1em;
        padding-bottom: 1em;
        font-weight: bold;
        text-align: center;
      }
      .aao-header h1 {
        line-height: 1.1em;
        font-size: 1.5em;
        margin-bottom: 0;
      }
    </style>
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
