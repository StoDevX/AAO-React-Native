// @flow
import React from 'react'
import {RefreshControl} from 'react-native'
import {ScrollView} from 'glamorous-native'
import {Markdown} from '../components/markdown'
import LoadingView from '../components/loading'
import {text} from '../../../docs/faqs.json'
import {tracker} from '../../analytics'
import bugsnag from '../../bugsnag'
import delay from 'delay'

const faqsUrl = 'https://stodevx.github.io/AAO-React-Native/faqs.json'

export class FaqView extends React.PureComponent {
  static navigationOptions = {
    title: 'FAQs',
  }

  state = {
    text: text,
    refreshing: false,
  }

  componentWillMount() {
    this.fetchData()
  }

  fetchData = async () => {
    let fetched = text
    try {
      let blob: {text: string} = await fetchJson(faqsUrl)
      fetched = blob.text
    } catch (err) {
      tracker.trackException(err.message)
      bugsnag.notify(err)
      console.warn(err.message)
    }

    if (process.env.NODE_ENV === 'development') {
      fetched = text
    }

    this.setState({text: fetched})
  }

  refresh = async () => {
    const start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = Date.now() - start
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    this.setState(() => ({refreshing: false}))
  }

  render() {
    if (!this.state.text) {
      return <LoadingView />
    }

    const refreshControl = (
      <RefreshControl
        refreshing={this.state.refreshing}
        onRefresh={this.refresh}
      />
    )

    return (
      <ScrollView refreshControl={refreshControl} paddingHorizontal={15}>
        <Markdown source={text} />
      </ScrollView>
    )
  }
}
