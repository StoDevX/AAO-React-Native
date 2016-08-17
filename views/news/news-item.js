// @flow
import React, {PropTypes} from 'react'
import {
  // Text,
  // ScrollView,
  WebView,
  Navigator,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
// let Entities = require('html-entities').AllHtmlEntities
// const entities = new Entities()
import type {StoryType, NewsItemPropsType} from './types'

function NewsItemContents({content}: StoryType) {
  content = content + `
    <style>
      body {
        font-family: -apple-system;
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
      }
      p {
        line-height: 1.2em;
      }
      a {
        pointer-events: none;
        color: black;
        text-decoration: none;
      }
    </style>
  `
  return (
    <WebView source={{html: content}} />
  )
}
NewsItemContents.propTypes = {
  author: PropTypes.string,
  categories: PropTypes.arrayOf(PropTypes.string),
  content: PropTypes.string,
  link: PropTypes.string,
  publishedDate: PropTypes.string,
  title: PropTypes.string,
}


export default function NewsItemView(props: NewsItemPropsType) {
  return <NavigatorScreen
    title={props.title}
    navigator={props.navigator}
    renderScene={NewsItemContents.bind(null, props.story)}
  />
}
NewsItemView.propTypes = {
  navigator: PropTypes.instanceOf(Navigator),
  story: PropTypes.object,
  title: PropTypes.string,
}
