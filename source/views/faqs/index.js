// @flow
import React from 'react'
import {WebView, StyleSheet} from 'react-native'
import LoadingView from '../components/loading'
import {text as faqs} from '../../docs/faqs.json'
import {tracker} from '../../analytics'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
})

export class FaqView extends React.Component {
  state = {
    html: faqs,
  }

  componentWillMount() {
    this.fetchData()
  }

  url = 'https://stodevx.github.io/AAO-React-Native/faqs.json'

  fetchData = async () => {
    let html = faqs
    try {
      let blob: {text: string} = await fetchJson(this.url)
      html = blob.text
    } catch (err) {
      html = faqs
      tracker.trackException(err.message)
      console.warn(err.message)
    }

    if (__DEV__) {
      html = faqs
    }

    this.setState({html: html})
  }

  render() {
    if (!this.state.html) {
      return <LoadingView />
    }
    return <WebView style={styles.container} source={{html: this.state.html}} />
  }
}
