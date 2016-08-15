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

function NewsItemContents({
  content,
}) {
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

export default function NewsItemView(props) {
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
