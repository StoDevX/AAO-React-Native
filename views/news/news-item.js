import React, {PropTypes} from 'react'
import {
  Text,
  ScrollView,
  WebView,
} from 'react-native'

let Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()

export default function NewsItemView({
  story: {
    title,
    publishedDate,
    author,
    content,
    link,
    categories,
  },
}) {
  return (
    <ScrollView>
      <Text>Title: {entities.decode(title)}</Text>
      <Text>Link: {entities.decode(link)}</Text>
      <Text>Categories: {categories.map(c => entities.decode(c)).join(', ')}</Text>
      <Text>Published on: {entities.decode(publishedDate)}</Text>
      <Text>by: {entities.decode(author)}</Text>
      <WebView source={{html: content}} />
    </ScrollView>
  )
}
NewsItemView.propTypes = {
  story: PropTypes.shape({
    title: PropTypes.string,
    publishedDate: PropTypes.string,
    author: PropTypes.string,
    content: PropTypes.string,
    link: PropTypes.string,
    categories: PropTypes.arrayOf(PropTypes.string),
  }),
}
