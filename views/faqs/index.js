// @flow

import React from 'react'
import {ListView, View, Text} from 'react-native'

class OfflineError extends Error {}

let fetchAndCache = async (url, cacheTime=[1, 'hour'], fetchArgs={}) => {
  let cached = JSON.parse(await AsyncStorage.getItem(`cache:${url}`))
  let online = await NetInfo.isConnected.fetch()
  if (!online) {
    return new OfflineError()
  }
  if (cached && moment(cacheTime))
  fetch(url, fetchArgs).then(status).then(resp)
}


function FaqItem({title, excerpt}) {
  return (
    <View>
      <Text>{title}</Text>
      <Text>{excerpt}</Text>
    </View>
  )
}

export default class FaqView extends React.Component {
  state = {
    faqs: [],
  }

  url = "https://stodevx.github.io/AAO-React-Native/faqs.md"

  componentWillMount() {
    this.fetchData()
  }

  fetchData = async (forceFromServer=false) => {
    let isOnline = await NetInfo.status()
    if (!isOnline) {
      this.setState({offline: true})
    }
    let markdown = await fetch(this.url).then(status).then(text)
    this.setState({raw: markdown})
  }

  render() {
    return (
      <ListView
        dataSource
      />
    )
  }
}
