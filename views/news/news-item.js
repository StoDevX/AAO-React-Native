// @flow
import React, {PropTypes} from 'react'
import {WebView} from 'react-native'

import type {StoryType} from './types'

export default function NewsItemView({story: {content, title}}: {source: string, story: StoryType}) {
  content = `
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
      }
      a {
        pointer-events: none;
        color: black;
        text-decoration: none;
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
      <h1>${title}</h1>
    </header>
    ${content}
  `
  return (
    <WebView source={{html: content}} />
  )
}
