// @flow
import React, {PropTypes} from 'react'
import {
  // Text,
  // ScrollView,
  WebView,
} from 'react-native'

// let Entities = require('html-entities').AllHtmlEntities
// const entities = new Entities()
import type {StoryType} from './types'

export default function NewsItemView({content}: StoryType) {
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
        display: block;
        margin: 12px auto;
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

NewsItemView.propTypes = {
  author: PropTypes.string,
  categories: PropTypes.arrayOf(PropTypes.string),
  content: PropTypes.string,
  link: PropTypes.string,
  publishedDate: PropTypes.string,
  title: PropTypes.string,
}
