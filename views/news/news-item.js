// @flow
import React, {PropTypes} from 'react'
import {WebView} from 'react-native'

import type {StoryType} from './types'

export default function NewsItemView({story: {content}}: {story: StoryType}) {
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
  story: PropTypes.shape({
    author: PropTypes.string,
    categories: PropTypes.arrayOf(PropTypes.string),
    content: PropTypes.string,
    link: PropTypes.string,
    publishedDate: PropTypes.string,
    title: PropTypes.string,
  }).isRequired,
}
